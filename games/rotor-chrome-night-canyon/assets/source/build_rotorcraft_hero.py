"""Build the durable Rotor Chrome hero asset and bright review renders.

Usage:
  blender -b --python build_rotorcraft_hero.py -- --out <output-directory>

The craft points toward Blender -Y, which exports as Three.js +Z through glTF.
"""

import argparse
import math
import os
import sys

import bpy
from mathutils import Vector


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    tail = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(tail)


OUT = os.path.abspath(parse_args().out)
os.makedirs(OUT, exist_ok=True)


def clean_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def material(name, color, metallic=0.0, roughness=0.45, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        emission_input = bsdf.inputs.get("Emission Color") or bsdf.inputs.get("Emission")
        strength_input = bsdf.inputs.get("Emission Strength")
        if emission_input:
            emission_input.default_value = (*emission, 1.0)
        if strength_input:
            strength_input.default_value = emission_strength
    return mat


def finish(obj, mat, parent, bevel=0.0, smooth=False):
    obj.data.materials.append(mat)
    obj.parent = parent
    if smooth and hasattr(obj.data, "polygons"):
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    if bevel:
        modifier = obj.modifiers.new("Edge highlights", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    return obj


def box(name, location, dimensions, mat, parent, rotation=(0, 0, 0), bevel=0.06):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, parent, bevel)


def ellipsoid(name, location, dimensions, mat, parent, subdivisions=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = tuple(value / 2 for value in dimensions)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, parent, 0.045, True)


def cylinder(name, location, radius, depth, mat, parent, rotation=(0, 0, 0), vertices=24, bevel=0.025):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation
    )
    obj = bpy.context.object
    obj.name = name
    return finish(obj, mat, parent, bevel, True)


def torus(name, location, major_radius, minor_radius, mat, parent, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=32,
        minor_segments=8,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    return finish(obj, mat, parent, 0.0, True)


def prism(name, vertices, faces, mat, parent, bevel=0.04):
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, mat, parent, bevel)


def tapered_blade(name, length, width, z, angle, mat, parent):
    half = width / 2
    root = 0.28
    tip = length
    vertices = [
        (root, -half, -0.035), (tip, -half * 0.45, -0.025),
        (tip, half * 0.45, -0.025), (root, half, -0.035),
        (root, -half, 0.035), (tip, -half * 0.45, 0.025),
        (tip, half * 0.45, 0.025), (root, half, 0.035),
    ]
    faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    blade = prism(name, vertices, faces, mat, parent, 0.02)
    blade.location.z = z
    blade.rotation_euler.z = angle
    return blade


def add_point_light(name, location, color, energy, parent):
    data = bpy.data.lights.new(name, "POINT")
    data.color = color
    data.energy = energy
    data.shadow_soft_size = 0.45
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.parent = parent
    return obj


clean_scene()
scene = bpy.context.scene

chrome = material("Satin Chrome", (0.48, 0.64, 0.74), 0.92, 0.18)
chrome_light = material("Edge Chrome", (0.78, 0.88, 0.93), 0.95, 0.11)
armor = material("Graphite Armor", (0.035, 0.055, 0.075), 0.78, 0.28)
panel = material("Blue Black Panels", (0.055, 0.11, 0.16), 0.72, 0.23)
canopy = material("Petrol Glass", (0.025, 0.22, 0.27), 0.64, 0.08, (0.02, 0.34, 0.42), 1.4)
cyan = material("Signal Cyan", (0.025, 0.55, 0.78), 0.3, 0.16, (0.02, 0.62, 0.92), 5.0)
amber = material("Rotor Amber", (0.95, 0.34, 0.035), 0.3, 0.2, (1.0, 0.18, 0.01), 4.0)
magenta = material("Stem Magenta", (0.75, 0.035, 0.32), 0.35, 0.18, (0.95, 0.02, 0.24), 3.2)

root = bpy.data.objects.new("RotorChromeHero", None)
bpy.context.collection.objects.link(root)

# Layered center body and cockpit.
ellipsoid("FuselageCore", (0, -0.15, 0.15), (2.25, 4.1, 1.25), armor, root, 3)
ellipsoid("UpperChromeShell", (0, -0.15, 0.48), (1.86, 3.45, 0.78), chrome, root, 2)
ellipsoid("CockpitCanopy", (0, -1.28, 0.62), (1.48, 1.72, 0.72), canopy, root, 3)
box("CanopySpine", (0, -0.92, 0.88), (0.12, 1.58, 0.12), chrome_light, root, bevel=0.035)

nose_vertices = [
    (-0.72, -1.55, -0.28), (0.72, -1.55, -0.28), (0.6, -1.55, 0.42), (-0.6, -1.55, 0.42),
    (-0.22, -2.72, -0.12), (0.22, -2.72, -0.12), (0.18, -2.72, 0.16), (-0.18, -2.72, 0.16),
]
prism("NeedleNose", nose_vertices, [(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)], panel, root, 0.055)
box("NoseSignal", (0, -2.74, 0.02), (0.34, 0.07, 0.11), cyan, root, bevel=0.025)

# Shoulder armor and twin ducted engine pods create the readable side silhouette.
for side in (-1, 1):
    x = 1.02 * side
    box(f"Shoulder_{side:+d}", (x * 0.72, -0.2, 0.35), (0.5, 2.55, 0.34), chrome, root,
        rotation=(0, 0, math.radians(-8 * side)), bevel=0.075)
    cylinder(f"EnginePod_{side:+d}", (x, 0.05, 0.02), 0.48, 1.75, panel, root,
             rotation=(math.pi / 2, 0, 0), vertices=32, bevel=0.045)
    torus(f"IntakeRing_{side:+d}", (x, -0.84, 0.02), 0.38, 0.075, chrome_light, root,
          rotation=(math.pi / 2, 0, 0))
    torus(f"ExhaustRing_{side:+d}", (x, 0.94, 0.02), 0.37, 0.09, amber, root,
          rotation=(math.pi / 2, 0, 0))
    cylinder(f"ExhaustGlow_{side:+d}", (x, 0.98, 0.02), 0.29, 0.035, amber, root,
             rotation=(math.pi / 2, 0, 0), vertices=32, bevel=0)
    box(f"Winglet_{side:+d}", (1.52 * side, 0.15, 0.22), (1.35, 1.18, 0.12), armor, root,
        rotation=(math.radians(3), math.radians(7 * side), math.radians(-13 * side)), bevel=0.045)
    box(f"WingTipSignal_{side:+d}", (2.12 * side, 0.08, 0.24), (0.18, 0.48, 0.09),
        cyan if side < 0 else magenta, root, rotation=(0, 0, math.radians(-13 * side)), bevel=0.025)

# Tail boom, V fins, and tail rotor.
box("TailBoom", (0, 2.05, 0.28), (0.48, 3.45, 0.42), armor, root,
    rotation=(math.radians(-4), 0, 0), bevel=0.075)
box("TailChromeCap", (0, 3.7, 0.52), (0.42, 0.42, 0.42), chrome, root, bevel=0.1)
for side in (-1, 1):
    box(f"TailFin_{side:+d}", (0.36 * side, 3.25, 1.0), (0.13, 1.05, 1.28), chrome, root,
        rotation=(math.radians(-8), math.radians(22 * side), math.radians(-18 * side)), bevel=0.045)
box("TailBeacon", (0, 3.88, 0.63), (0.16, 0.2, 0.16), magenta, root, bevel=0.035)

tail_rotor = bpy.data.objects.new("TailRotor", None)
bpy.context.collection.objects.link(tail_rotor)
tail_rotor.parent = root
tail_rotor.location = (0.34, 3.62, 0.62)
tail_rotor.rotation_euler = (math.pi / 2, 0, 0)
for index in range(4):
    tapered_blade(f"TailBlade_{index}", 0.72, 0.12, 0, index * math.pi / 2, amber, tail_rotor)
cylinder("TailRotorHub", (0, 0, 0), 0.13, 0.22, chrome_light, tail_rotor,
         rotation=(math.pi / 2, 0, 0), vertices=20)

# Coaxial four-blade rotor with a bright hub and contrasting tip marks.
cylinder("RotorMast", (0, -0.05, 1.08), 0.12, 0.72, chrome_light, root, vertices=20)
main_rotor = bpy.data.objects.new("MainRotor", None)
bpy.context.collection.objects.link(main_rotor)
main_rotor.parent = root
for index in range(4):
    angle = index * math.pi / 2 + math.pi / 4
    tapered_blade(f"MainBlade_{index}", 3.22, 0.22, 1.38, angle, chrome_light, main_rotor)
    tip = box(f"RotorTip_{index}", (2.95 * math.cos(angle), 2.95 * math.sin(angle), 1.38),
              (0.36, 0.18, 0.08), amber, main_rotor, rotation=(0, 0, angle), bevel=0.02)
    tip.parent = main_rotor
cylinder("RotorHub", (0, 0, 1.38), 0.28, 0.22, armor, main_rotor, vertices=24)
torus("RotorHubSignal", (0, 0, 1.5), 0.24, 0.055, cyan, main_rotor)

# Landing skids and underbody signal bars remain visible from the chase camera.
for side in (-1, 1):
    box(f"SkidRail_{side:+d}", (0.76 * side, 0.0, -0.62), (0.12, 3.2, 0.12), chrome_light, root,
        rotation=(math.radians(2), 0, 0), bevel=0.05)
    for y in (-0.85, 0.72):
        box(f"SkidStrut_{side:+d}_{y:+.2f}", (0.52 * side, y, -0.34), (0.1, 0.1, 0.72),
            armor, root, rotation=(0, math.radians(-22 * side), 0), bevel=0.03)
box("UnderbodySignal", (0, 0.52, -0.5), (0.24, 1.35, 0.09), cyan, root, bevel=0.025)
add_point_light("CraftFill", (0, 0.4, 0.8), (0.18, 0.68, 1.0), 35, root)

# Export only the authored craft hierarchy.
bpy.ops.object.select_all(action="DESELECT")
for obj in [root] + list(root.children_recursive):
    obj.select_set(True)
bpy.context.view_layer.objects.active = root
glb_path = os.path.join(OUT, "rotorcraft_hero.glb")
bpy.ops.export_scene.gltf(filepath=glb_path, export_format="GLB", use_selection=True)

# Neutral studio setup for evidence renders.
ground_mat = material("Studio Floor", (0.055, 0.065, 0.075), 0.15, 0.5)
box("StudioFloor", (0, 0.2, -0.88), (14, 14, 0.2), ground_mat, None, bevel=0.15)
world = scene.world or bpy.data.worlds.new("Rotor Studio World")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.018, 0.025, 0.035, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.38

def area(name, location, color, energy, size):
    data = bpy.data.lights.new(name, "AREA")
    data.color = color
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    look_at(obj, (0, 0, 0.25))


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


area("LargeCoolKey", (-5.5, -5.0, 7.0), (0.72, 0.88, 1.0), 1250, 5.0)
area("WarmRearRim", (5.0, 5.5, 4.5), (1.0, 0.45, 0.2), 1000, 4.0)
area("SoftSideFill", (5.0, -2.0, 2.2), (0.28, 0.7, 1.0), 750, 4.0)

camera_data = bpy.data.cameras.new("EvidenceCamera")
camera = bpy.data.objects.new("EvidenceCamera", camera_data)
bpy.context.collection.objects.link(camera)
scene.camera = camera
camera.data.lens = 56

for render_engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        scene.render.engine = render_engine
        break
    except TypeError:
        continue
if hasattr(scene, "eevee"):
    scene.eevee.taa_render_samples = 16
scene.render.resolution_x = 700
scene.render.resolution_y = 520
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.render.image_settings.color_mode = "RGBA"

views = [
    ("rear-three-quarter", (6.8, 7.6, 4.5), (0, 0.25, 0.35)),
    ("side-silhouette", (8.8, 0.4, 2.7), (0, 0.25, 0.25)),
    ("front-three-quarter", (-6.2, -7.8, 3.8), (0, -0.2, 0.25)),
    ("upper-plan", (5.8, 5.2, 9.5), (0, 0.25, 0.15)),
]
width, height = scene.render.resolution_x, scene.render.resolution_y
render_pixels = []
for label, location, target in views:
    camera.location = location
    look_at(camera, target)
    scene.render.filepath = os.path.join(OUT, f"{label}.png")
    bpy.ops.render.render(write_still=True)
    rendered = bpy.data.images.load(scene.render.filepath, check_existing=False)
    pixels = [0.0] * (width * height * 4)
    rendered.pixels.foreach_get(pixels)
    render_pixels.append(pixels)
    bpy.data.images.remove(rendered)

sheet = bpy.data.images.new("RotorcraftContactSheet", width=width * 2, height=height * 2, alpha=True)
sheet_pixels = [0.0] * (width * 2 * height * 2 * 4)
for index, pixels in enumerate(render_pixels):
    offset_x = (index % 2) * width
    offset_y = (1 - index // 2) * height
    for y in range(height):
        source = y * width * 4
        target = ((offset_y + y) * width * 2 + offset_x) * 4
        sheet_pixels[target : target + width * 4] = pixels[source : source + width * 4]
sheet.pixels.foreach_set(sheet_pixels)
sheet.filepath_raw = os.path.join(OUT, "rotorcraft_contact_sheet.png")
sheet.file_format = "PNG"
sheet.save()

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "rotorcraft_hero_source.blend"))
print(f"ROTORCRAFT_HERO_READY={OUT}")
