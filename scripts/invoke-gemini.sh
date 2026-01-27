#!/bin/bash
# Wrapper pour appeler Gemini CLI depuis Clawdbot
# Usage: ./invoke-gemini.sh "Instructions"

export HOME="/root"
# Ajout du PATH Node.js pour s'assurer que gemini est trouvé
export PATH="/root/.nvm/versions/node/v24.12.0/bin:$PATH"

LOG_FILE="/root/rpb-dashboard/logs/gemini-bridge.log"
mkdir -p "$(dirname "$LOG_FILE")"

echo "---------------------------------------------------" >> "$LOG_FILE"
echo "[$(date)] 🤖 Clawdbot invoked Gemini." >> "$LOG_FILE"
echo "📝 Instruction: $1" >> "$LOG_FILE"

# Exécution de Gemini
# -p : Mode non-interactif (Prompt mode)
# Nous ajoutons une instruction système pour garantir l'autonomie
SYSTEM_PROMPT="Tu es l'ingénieur en chef. Clawdbot est l'architecte. Tu DOIS exécuter cette demande concrètement en modifiant les fichiers. Ne pose pas de questions. Agis."

gemini -p "$SYSTEM_PROMPT. Tâche : $1" >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ [$(date)] Success." >> "$LOG_FILE"
else
    echo "❌ [$(date)] Failed with code $EXIT_CODE." >> "$LOG_FILE"
fi

exit $EXIT_CODE