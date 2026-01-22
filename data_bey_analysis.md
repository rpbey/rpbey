# Data Bey Analysis

This document summarizes the contents and structure of the `data_bey` directory, which contains 3D assets (OBJ files) and textures (PNG files) for Beyblade X components.

## Directory Structure Overview

The root `data_bey/` directory is organized into several main categories corresponding to Beyblade parts:

- **Blades [Xover]**: Crossover generation blades.
- **[BX] Blades**: Mainline Beyblade X blades.
- **[UX] Blades**: Unique Line blades.
- **[CX] MainBlades**: Custom/Concept blades (Main).
- **[CX] AssistBlade**: Custom/Concept blades (Assist/Support).
- **Ratchets**: Ratchet components (Height and number of protrusions).
- **Bits**: Bit components (Tips/Drivers).
- **Chip**: Gear Chips and Lock Chips.
- **Texture**: Image textures for the 3D models.

## Detailed Content Analysis

### 1. Blades

#### [BX] Blades (Beyblade X Mainline)
Contains subdirectories for each blade model. Each typically includes separate OBJ files for the Metal, Plastic, and sometimes other layers.
*   **Models found:** BlackShell, CobaltDragoon, CobaltDrake, CrimsonGaruda, CrocCrunch, DranDagger, DranSword, HellsChain, HellsScythe, KnightLance, KnightShield, KongYell, LeonClaw, MammothTusk, PhoenixFeather, PhoenixWing, PteraSwing, RhinoHorn, SamuraiSteel, SharkEdge, SharkGill, ShinobiKnife, SphinxCowl, TyrannoBeat, TyrannoRoar, UnicornSting, ViperTail, WeissTiger, WhaleWave, WizardArrow, WyvernGale.
*   **Structure:** `[ModelName]/[ModelName]_[Material].obj`

#### [UX] Blades (Unique Line)
Contains models with gimmick features or specific designs like Gear Chips separated.
*   **Models found:** AeroPegasus, DranBuster, HellsHammer, ImpactDrake, KnightMail, LeonCrest, PhoenixRudder, SamuraiSaber, ShinobiShadow, SilverWolf, WizardRod, WyvernHover.
*   **Structure:** `[ModelName]/[ModelName]_[Material].obj` (Includes GearChip, Gimmick, Rubber files).

#### Blades [Xover] (Crossover)
Remakes of blades from previous generations (Bakuten, Metal Fight, Burst).
*   **Models found:** DragoonStorm, DranzerSpiral, DrigerSlash, StormPegasis, VictoryValkyrie.
*   **Structure:** Split into TopLayer, BottomLayer, and Metal.

#### [CX] Custom / Concept Blades
*   **MainBlades:** Arc, Blast, Brave, Dark, Flame, Reaper, Volt.
*   **AssistBlade:** Assault, Bumper, Massive, Round, Slash, Turn (Base/Disk), Wheel.

### 2. Ratchets
Contains OBJ files for various ratchets, including standard heights (60, 70, 80) and specific ratchet configurations (3-60, 4-60, etc.).
*   **Common parts:** Base Parts (55, 60, 70, 80, 85), Clips.
*   **Specific models:** 1, 2, 3, 4, 5, 6, 7, 9, 3-85, 4-55.
*   **Turbo Ratchets:** A subdirectory `Turbo` with specialized parts (Tr_Base, Tr_Bit, Tr_Gimmick, etc.).

### 3. Bits
Organized into two subfolders:
*   **Full:** Complete bit models named by code (A, B, C, D, DB, E, F, FB, GB, GF, GN, H, K, L, LF, LO, LR, MN, N, O, P, Q, R, RA, T, TP, U, V, W).
*   **In Parts:** Deconstructed bit components (Ball, Flat, Needle, Taper, Gear variants, High variants, etc.).

### 4. Chips
Contains standard and left-spin variants of chips.
*   **Files:** Caps, GearChip, LockChip, Metal LockChip (Base/Plate).

### 5. Textures
A flat directory containing `.png` texture files applied to the 3D models.
*   **Organization:** Named by color and blade code (e.g., `Blue_WA.png`, `Red_DS.png`).
*   **Subdirectory:** `Texture (White)` contains generic or white-base textures for most models (e.g., `DRANSWORD.png`, `HELLSSCYTHE.png`).

## Summary of Counts
*   **BX Blades:** ~30 Models
*   **UX Blades:** ~12 Models
*   **Xover Blades:** 5 Models
*   **CX Blades:** 7 Main, 7 Assist
*   **Ratchets:** Extensive collection of base sizes and specific configurations.
*   **Bits:** 29 Full models + individual component parts.
*   **Textures:** Comprehensive set of color variants and base textures.

This archive provides a complete asset library for rendering or displaying 3D Beyblade X models with customizable parts and colors.
