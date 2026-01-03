import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const BOT_CONFIG_PATH = process.env.BOT_CONFIG_PATH || '/root/rpb-bot/.env'
const BOT_CONSTANTS_PATH = process.env.BOT_CONSTANTS_PATH || '/root/rpb-bot/src/lib/constants.ts'

interface BotConfig {
  env: Record<string, string>
  constants: {
    RPB: Record<string, string>
    Colors: Record<string, string>
    Channels: Record<string, string>
    Roles: Record<string, string>
  }
}

function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {}
  const lines = content.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    
    const [key, ...valueParts] = trimmed.split('=')
    if (key) {
      let value = valueParts.join('=')
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
  }
  
  return env
}

function parseConstantsFile(content: string): BotConfig['constants'] {
  const result: BotConfig['constants'] = {
    RPB: {},
    Colors: {},
    Channels: {},
    Roles: {},
  }
  
  // Parse RPB object
  const rpbMatch = content.match(/export const RPB\s*=\s*\{([^}]+)\}/s)
  if (rpbMatch?.[1]) {
    const entries = rpbMatch[1].matchAll(/(\w+):\s*["']([^"']+)["']/g)
    for (const [, key, value] of entries) {
      if (key && value) result.RPB[key] = value
    }
  }
  
  // Parse Colors object
  const colorsMatch = content.match(/export const Colors\s*=\s*\{([^}]+)\}/s)
  if (colorsMatch?.[1]) {
    const entries = colorsMatch[1].matchAll(/(\w+):\s*(0x[\da-fA-F]+|\d+)/g)
    for (const [, key, value] of entries) {
      if (key && value) result.Colors[key] = value
    }
  }
  
  // Parse Channels object
  const channelsMatch = content.match(/export const Channels\s*=\s*\{([^}]+)\}/s)
  if (channelsMatch?.[1]) {
    const entries = channelsMatch[1].matchAll(/(\w+):\s*["']([^"']+)["']/g)
    for (const [, key, value] of entries) {
      if (key && value) result.Channels[key] = value
    }
  }
  
  // Parse Roles object
  const rolesMatch = content.match(/export const Roles\s*=\s*\{([^}]+)\}/s)
  if (rolesMatch?.[1]) {
    const entries = rolesMatch[1].matchAll(/(\w+):\s*["']([^"']+)["']/g)
    for (const [, key, value] of entries) {
      if (key && value) result.Roles[key] = value
    }
  }
  
  return result
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const [envContent, constantsContent] = await Promise.all([
      readFile(BOT_CONFIG_PATH, 'utf-8').catch(() => ''),
      readFile(BOT_CONSTANTS_PATH, 'utf-8').catch(() => ''),
    ])
    
    const config: BotConfig = {
      env: parseEnvFile(envContent),
      constants: parseConstantsFile(constantsContent),
    }
    
    // Mask sensitive values
    const sensitiveKeys = ['TOKEN', 'SECRET', 'PASSWORD', 'KEY', 'PRIVATE']
    for (const key of Object.keys(config.env)) {
      if (sensitiveKeys.some((s) => key.toUpperCase().includes(s))) {
        config.env[key] = '••••••••'
      }
    }
    
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch config', details: String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const { type, key, value } = body as { type: 'env' | 'constants'; key: string; value: string }
  
  if (!type || !key) {
    return NextResponse.json({ error: 'Missing type or key' }, { status: 400 })
  }
  
  try {
    if (type === 'env') {
      const content = await readFile(BOT_CONFIG_PATH, 'utf-8')
      const lines = content.split('\n')
      let found = false
      
      const newLines = lines.map((line) => {
        if (line.startsWith(`${key}=`)) {
          found = true
          return `${key}=${value}`
        }
        return line
      })
      
      if (!found) {
        newLines.push(`${key}=${value}`)
      }
      
      await writeFile(BOT_CONFIG_PATH, newLines.join('\n'))
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json(
      { error: 'Failed to update config', details: String(error) },
      { status: 500 }
    )
  }
}
