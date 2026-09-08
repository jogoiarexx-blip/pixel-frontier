// Fronteira de Cobre: primitivas de pixel art modular, com blocos e paleta limitada.
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
const materialCache = new Map();
function colorMaterial(scene, hex) {
    const cacheKey = `${scene.uid}-${hex}`;
    const cached = materialCache.get(cacheKey);
    if (cached)
        return cached;
    const color = Color3.FromHexString(hex);
    const material = new StandardMaterial(`mat-${hex}`, scene);
    material.diffuseColor = color;
    material.emissiveColor = color;
    material.specularColor = Color3.Black();
    material.backFaceCulling = false;
    materialCache.set(cacheKey, material);
    return material;
}
export function rect(scene, name, width, height, color, parent, x = 0, y = 0, z = 0) {
    const mesh = MeshBuilder.CreatePlane(name, { width, height }, scene);
    mesh.material = colorMaterial(scene, color);
    mesh.position.set(x, y, z);
    if (parent)
        mesh.parent = parent;
    return mesh;
}
export function sprite(scene, name, parts, z = 0) {
    const root = new TransformNode(name, scene);
    root.position.z = z;
    parts.forEach((part, index) => {
        rect(scene, `${name}-${part.tag ?? `p${index}`}`, part.width, part.height, part.color, root, part.x, part.y, part.z ?? 0);
    });
    return root;
}
export function assetSprite(scene, name, assetUrl, width, height, z = 0, yOffset = 0) {
    const root = new TransformNode(name, scene);
    root.position.z = z;
    const texture = new Texture(assetUrl, scene, true, false, Texture.NEAREST_SAMPLINGMODE);
    texture.hasAlpha = true;
    texture.vScale = -1;
    texture.vOffset = 1;
    const material = new StandardMaterial(`${name}-asset-material`, scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.opacityTexture = texture;
    material.useAlphaFromDiffuseTexture = true;
    material.specularColor = Color3.Black();
    material.backFaceCulling = false;
    const plane = MeshBuilder.CreatePlane(`${name}-asset`, { width, height }, scene);
    plane.material = material;
    plane.parent = root;
    plane.position.y = yOffset;
    return root;
}
export function assetSheetSprite(scene, name, assetUrl, frameCount, width, height, z = 0, yOffset = 0) {
    const root = new TransformNode(name, scene);
    root.position.z = z;
    const texture = new Texture(assetUrl, scene, true, false, Texture.NEAREST_SAMPLINGMODE);
    texture.hasAlpha = true;
    texture.wrapU = Texture.CLAMP_ADDRESSMODE;
    texture.wrapV = Texture.CLAMP_ADDRESSMODE;
    texture.uScale = 1 / frameCount;
    texture.uOffset = 0;
    texture.vScale = -1;
    texture.vOffset = 1;
    const material = new StandardMaterial(`${name}-sheet-material`, scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.opacityTexture = texture;
    material.useAlphaFromDiffuseTexture = true;
    material.specularColor = Color3.Black();
    material.backFaceCulling = false;
    const plane = MeshBuilder.CreatePlane(`${name}-sheet`, { width, height }, scene);
    plane.material = material;
    plane.parent = root;
    plane.position.y = yOffset;
    root.metadata = { ...(root.metadata ?? {}), spriteSheet: { texture, frameCount, currentFrame: 0 } };
    return root;
}
export function setAssetFrame(root, frame) {
    const data = root.metadata?.spriteSheet;
    if (!data?.texture || !data.frameCount)
        return;
    const normalized = ((Math.floor(frame) % data.frameCount) + data.frameCount) % data.frameCount;
    if (data.currentFrame === normalized)
        return;
    data.currentFrame = normalized;
    data.texture.uOffset = normalized / data.frameCount;
}
export function textBoard(scene, name, width, height, position) {
    const root = new TransformNode(name, scene);
    root.position.set(position.x, position.y, position.z);
    rect(scene, `${name}-trim`, width + 0.22, height + 0.22, "#e6752a", root, 0, 0, 0.12);
    rect(scene, `${name}-ink`, width, height, "#102633", root, 0, 0, 0.1);
    rect(scene, `${name}-notch-a`, 0.6, 0.2, "#f2c063", root, -width / 2 + 0.38, height / 2 - 0.2, 0.06);
    rect(scene, `${name}-notch-b`, 0.6, 0.2, "#f2c063", root, width / 2 - 0.38, -height / 2 + 0.2, 0.06);
    [-0.28, 0, 0.28].forEach((offset, index) => {
        const stripe = rect(scene, `${name}-hazard-${index}`, 0.13, 0.78, "#e6752a", root, width / 2 - 0.72 + offset, height / 2 - 0.64, 0.07);
        stripe.rotation.z = -0.58;
    });
    const compact = height < 4;
    const textureHeight = compact ? 256 : 512;
    const texture = new DynamicTexture(`${name}-text`, { width: 1024, height: textureHeight }, scene, true);
    texture.hasAlpha = true;
    const textMaterial = new StandardMaterial(`${name}-text-mat`, scene);
    textMaterial.diffuseTexture = texture;
    textMaterial.emissiveTexture = texture;
    textMaterial.opacityTexture = texture;
    textMaterial.useAlphaFromDiffuseTexture = true;
    textMaterial.backFaceCulling = false;
    const textPlane = MeshBuilder.CreatePlane(`${name}-text-plane`, { width: width - 0.38, height: height - 0.32 }, scene);
    textPlane.parent = root;
    textPlane.position.z = -0.05;
    textPlane.material = textMaterial;
    const setText = (title, lines, highlight = -1) => {
        const context = texture.getContext();
        context.clearRect(0, 0, 1024, textureHeight);
        context.textBaseline = "top";
        context.fillStyle = "#f5efd4";
        context.font = compact ? "bold 42px monospace" : "bold 58px monospace";
        context.fillText(title, 54, compact ? 18 : 36);
        context.fillStyle = "#5bd6d0";
        context.fillRect(54, compact ? 68 : 108, 240, 8);
        const baseFont = compact ? 28 : 32;
        const minFont = compact ? 19 : 21;
        const maxWidth = 900;
        const drawFitted = (value, x, y) => {
            const text = String(value ?? "");
            let size = baseFont;
            context.font = `${size}px monospace`;
            while (size > minFont && context.measureText(text).width > maxWidth) {
                size -= 1;
                context.font = `${size}px monospace`;
            }
            let output = text;
            if (context.measureText(output).width > maxWidth) {
                while (output.length > 4 && context.measureText(`${output}…`).width > maxWidth)
                    output = output.slice(0, -1);
                output += "…";
            }
            context.fillText(output, x, y);
        };
        lines.forEach((line, index) => {
            const y = (compact ? 96 : 150) + index * (compact ? 42 : 52);
            if (index === highlight) {
                context.fillStyle = "#e6752a";
                context.fillRect(38, y - 8, 900, compact ? 36 : 42);
                context.fillStyle = "#102633";
                drawFitted(`> ${line}`, 56, y);
            }
            else {
                context.fillStyle = index > 2 ? "#8badb5" : "#f5efd4";
                drawFitted(line, 56, y);
            }
        });
        texture.update();
    };
    return {
        root,
        setText,
        visible: (value) => root.setEnabled(value),
    };
}
export function meter(scene, name, width, color, parent, x, y) {
    const root = new TransformNode(name, scene);
    root.parent = parent;
    root.position.set(x, y, 0);
    rect(scene, `${name}-back`, width + 0.12, 0.46, "#07141d", root, 0, 0, 0);
    const fill = rect(scene, `${name}-fill`, width, 0.30, color, root, -width / 2, 0, -0.08);
    fill.setPivotPoint(new Vector3(-0.5, 0, 0));
    return { root, fill, width };
}
