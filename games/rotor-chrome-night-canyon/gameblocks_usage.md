# GameBlocks Usage — Rotor Chrome Night Canyon

## Selected Modules

| Module | Source Path | Status | Key Changes |
|---|---|---|---|
| `WorldBasis.js` | `modules/math/WorldBasis.js` | Reused as-is | Coordinate system ground truth; defines planar directions, up axis, yaw/pitch/roll frames |
| `TimeUtils.js` | `modules/math/TimeUtils.js` | Reused as-is | Millisecond/second clock helpers |
| `Vector3Utils.js` | `modules/math/Vector3Utils.js` | Reused as-is | Vector normalization, basis-aware planar direction helpers |
| `ScalarUtils.js` | `modules/math/ScalarUtils.js` | Reused as-is | `clamp`, `smoothToward` for control smoothing |
| `GeneralVehicleMotionController.js` | `modules/actor-motion/GeneralVehicleMotionController.js` | Available, not directly called | Game uses a simplified custom motion model (direct position/rotation update) for the rotorcraft to keep the chase-cam and banking feel cinematic rather than arcade-vehicle-like |
| `GeneralObjectModelController.js` | `modules/actor-motion/GeneralObjectModelController.js` | Available, not directly called | Model transform handling done inline for the rotorcraft (yaw/pitch/roll → mesh rotation) |
| `PoseFollowCameraRig.js` | `modules/camera/PoseFollowCameraRig.js` | Available, not directly called | Game uses a custom chase-cam with `camera.position.lerp()` + `camera.lookAt()` for the cinematic follow feel |
| `BaseCameraRig.js` | `modules/camera/BaseCameraRig.js` | Available, not directly called | Base camera rig patterns inform the custom chase-cam implementation |
| `FlightPlay.js` | `modules/gameplay/FlightPlay.js` | Available, not directly called | Game uses custom win/lose logic (reach end of canyon vs. crash); FlightPlay pattern informed the design |
| `Object3DUtils.js` | `modules/world/Object3DUtils.js` | Available, not directly called | Cleanup utilities available; not needed in this session-based game |
| `DomHudRenderer.js` | `modules/user-interface/DomHudRenderer.js` | Available, not directly called | HUD rendered with direct DOM manipulation (score, stems, gates) |
| `PickupObject.js` | `modules/world/object/PickupObject.js` | Available, not directly called | Pylon pickup pattern informed the `makePylon()` implementation |
| `AirplaneVisualFactory.js` | `modules/world/object/factory/AirplaneVisualFactory.js` | Available, not directly called | Custom `Rotorcraft.js` module built for the helicopter aesthetic (main rotor, tail rotor, skids) instead of fixed-wing airplane |
| `PickupVisualFactory.js` | `modules/world/object/factory/PickupVisualFactory.js` | Available, not directly called | Custom pylon visuals built with GLB-integrated sonar contact markers |

## Why Not Direct GameBlocks?

The GameBlocks modules are designed for structured game genres (FPS, racing, arena combat). This game is a cinematic canyon flight experience with a music-building mechanic. The core gameplay (chase-cam, canyon tunnel, pylon collection, stem system) is more cinematic than the GameBlocks' structured patterns. The modules were copied and made available as a reference library (`lib/`) but the game implements its own:

- **Motion**: Direct position/rotation update with smooth banking (not `GeneralVehicleMotionController`'s structured acceleration model)
- **Camera**: Custom chase-cam with `lerp` follow and forward look (not `PoseFollowCameraRig`'s rigid frame-follow)
- **Gameplay**: Custom win/lose logic based on canyon progress (not `FlightPlay`'s crash-height model)
- **Visuals**: Custom rotorcraft model (main rotor, tail rotor, skids, navigation lights) vs. airplane geometry

The GameBlocks modules serve as a reference for coordinate conventions (`WorldBasis.js`), cleanup patterns (`Object3DUtils.js`), and the overall Three.js architecture. They were copied into `lib/` for reuse by future work orders.

## Key Design Decisions

1. **Chase camera over fixed cam**: The game uses a smooth follow camera that maintains cinematic distance while the player banks through the canyon.
2. **Stem system**: Collecting pylons activates visible light layers and increases music gain — this is the core "music build" mechanic.
3. **Foundry GLBs as active objects**: sonar_friendly.glb and sonar_unknown.glb are loaded into the scene as gate and pylon markers respectively, not as decorative decorations.
4. **No external CDN**: All game code is local; Three.js loaded via importmap for clean module resolution.
