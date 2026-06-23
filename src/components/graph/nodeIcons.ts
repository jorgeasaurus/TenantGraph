import * as THREE from 'three';
import type { TenantNode } from '../../models/tenantGraph';
import { graphText, metadataText, nodeColors } from '../../utils/graphUtils';
import { policyNodeTypes } from '../../utils/typePresentation';

type IconKind =
  | 'androidDevice'
  | 'app'
  | 'assignment'
  | 'cloudApp'
  | 'device'
  | 'filter'
  | 'group'
  | 'iosDevice'
  | 'macDevice'
  | 'policy'
  | 'role'
  | 'scopeTag'
  | 'signIn'
  | 'location'
  | 'user'
  | 'windowsDevice';

const policyTypeSet = new Set<TenantNode['type']>(policyNodeTypes);
const iconCanvasCache = new Map<string, HTMLCanvasElement>();
const maxIconCanvasCacheEntries = 360;

export function makeNodeIcon(
  node: TenantNode,
  color: string,
  prominent: boolean,
  nodeImage?: HTMLImageElement,
): THREE.Sprite {
  const kind = nodeIconKind(node);
  const canvas = getCachedCanvas(iconCanvasCache, nodeIconCanvasCacheKey(kind, color, prominent, nodeImage), () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;

    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.shadowColor = color;
      context.shadowBlur = prominent ? 50 : 38;
      context.fillStyle = color;
      context.globalAlpha = prominent ? 0.44 : 0.36;
      context.beginPath();
      context.roundRect(44, 44, 168, 168, prominent ? 48 : 42);
      context.fill();
      context.globalAlpha = 1;
      context.shadowBlur = 0;

      const background = context.createLinearGradient(62, 48, 198, 214);
      background.addColorStop(0, tint(color, 0.48));
      background.addColorStop(1, tint(color, -0.22));
      context.fillStyle = background;
      context.beginPath();
      context.roundRect(58, 48, 140, 152, 34);
      context.fill();

      context.strokeStyle = tint(color, 0.78);
      context.lineWidth = prominent ? 8 : 7;
      context.beginPath();
      context.roundRect(58, 48, 140, 152, 34);
      context.stroke();

      context.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(82, 60);
      context.lineTo(174, 60);
      context.stroke();

      if (kind === 'app' && nodeImage) {
        drawAppIconImage(context, nodeImage);
      } else if (kind === 'user' && nodeImage) {
        drawUserPhotoImage(context, nodeImage);
      } else {
        drawGlyph(context, kind);
      }

      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = 16;
      context.beginPath();
      context.arc(184, 64, prominent ? 8 : 6, 0, Math.PI * 2);
      context.fill();
    }

    return canvas;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }),
  );
}

export function iconColor(node: TenantNode): string {
  switch (nodeIconKind(node)) {
    case 'windowsDevice':
      return '#3fd1ff';
    case 'iosDevice':
      return '#38bdf8';
    case 'macDevice':
      return '#e2e8f0';
    case 'androidDevice':
      return '#14f195';
    case 'policy':
      return '#a78bfa';
    default:
      return nodeColors[node.type] ?? '#64748b';
  }
}

function nodeIconKind(node: TenantNode): IconKind {
  if (node.type === 'device') {
    const os = [metadataText(node, 'os'), graphText(node.raw, 'operatingSystem'), node.subtitle]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (os.includes('windows')) {
      return 'windowsDevice';
    }
    if (os.includes('ios') || os.includes('ipad') || os.includes('iphone')) {
      return 'iosDevice';
    }
    if (os.includes('mac')) {
      return 'macDevice';
    }
    if (os.includes('android')) {
      return 'androidDevice';
    }
    return 'device';
  }

  if (policyTypeSet.has(node.type)) {
    return 'policy';
  }

  if (node.type === 'appAssignment') {
    return 'assignment';
  }
  if (node.type === 'cloudApp') {
    return 'cloudApp';
  }
  if (node.type === 'directoryRole') {
    return 'role';
  }
  if (node.type === 'assignmentFilter') {
    return 'filter';
  }
  if (node.type === 'scopeTag') {
    return 'scopeTag';
  }
  if (node.type === 'signInEvent') {
    return 'signIn';
  }
  if (node.type === 'networkLocation') {
    return 'location';
  }
  if (node.type === 'user' || node.type === 'group' || node.type === 'app') {
    return node.type;
  }

  return 'policy';
}

function drawGlyph(context: CanvasRenderingContext2D, kind: IconKind): void {
  context.save();
  context.strokeStyle = '#f8fbff';
  context.fillStyle = '#f8fbff';
  context.lineWidth = 11;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.shadowColor = 'rgba(0, 0, 0, 0.72)';
  context.shadowBlur = 10;

  switch (kind) {
    case 'windowsDevice':
      drawMonitor(context);
      context.lineWidth = 4;
      context.strokeRect(103, 88, 20, 18);
      context.strokeRect(133, 88, 20, 18);
      context.strokeRect(103, 116, 20, 18);
      context.strokeRect(133, 116, 20, 18);
      break;
    case 'iosDevice':
      context.beginPath();
      context.roundRect(94, 66, 68, 124, 18);
      context.stroke();
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(116, 173);
      context.lineTo(140, 173);
      context.stroke();
      context.font = '700 25px Aptos, Segoe UI, sans-serif';
      context.textAlign = 'center';
      context.fillText('iOS', 128, 127);
      break;
    case 'macDevice':
      context.beginPath();
      context.roundRect(78, 78, 100, 70, 8);
      context.stroke();
      context.beginPath();
      context.moveTo(64, 166);
      context.lineTo(192, 166);
      context.lineTo(178, 178);
      context.lineTo(78, 178);
      context.closePath();
      context.stroke();
      break;
    case 'androidDevice':
      context.beginPath();
      context.arc(128, 88, 30, Math.PI, 0);
      context.moveTo(106, 70);
      context.lineTo(94, 52);
      context.moveTo(150, 70);
      context.lineTo(162, 52);
      context.stroke();
      context.beginPath();
      context.roundRect(94, 100, 68, 74, 12);
      context.stroke();
      context.beginPath();
      context.arc(116, 88, 3.6, 0, Math.PI * 2);
      context.arc(140, 88, 3.6, 0, Math.PI * 2);
      context.fill();
      break;
    case 'device':
      drawMonitor(context);
      break;
    case 'user':
      context.beginPath();
      context.arc(128, 91, 28, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(84, 174);
      context.quadraticCurveTo(128, 128, 172, 174);
      context.stroke();
      break;
    case 'group':
      context.lineWidth = 7;
      context.beginPath();
      context.arc(101, 100, 18, 0, Math.PI * 2);
      context.arc(155, 100, 18, 0, Math.PI * 2);
      context.arc(128, 82, 21, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(80, 172);
      context.quadraticCurveTo(101, 142, 124, 164);
      context.moveTo(132, 164);
      context.quadraticCurveTo(155, 142, 176, 172);
      context.moveTo(94, 158);
      context.quadraticCurveTo(128, 122, 162, 158);
      context.stroke();
      break;
    case 'app':
      for (const [x, y] of [
        [88, 86],
        [132, 86],
        [88, 130],
        [132, 130],
      ] as const) {
        context.beginPath();
        context.roundRect(x, y, 34, 34, 9);
        context.stroke();
      }
      break;
    case 'cloudApp':
      context.beginPath();
      context.moveTo(84, 145);
      context.bezierCurveTo(70, 145, 64, 136, 64, 126);
      context.bezierCurveTo(64, 114, 74, 104, 88, 104);
      context.bezierCurveTo(94, 82, 113, 72, 132, 78);
      context.bezierCurveTo(145, 62, 174, 72, 176, 98);
      context.bezierCurveTo(190, 101, 198, 112, 198, 126);
      context.bezierCurveTo(198, 138, 188, 145, 174, 145);
      context.closePath();
      context.stroke();
      context.lineWidth = 6;
      context.beginPath();
      context.arc(112, 166, 8, 0, Math.PI * 2);
      context.arc(144, 166, 8, 0, Math.PI * 2);
      context.moveTo(120, 166);
      context.lineTo(136, 166);
      context.stroke();
      break;
    case 'assignment':
      context.beginPath();
      context.roundRect(82, 78, 76, 92, 12);
      context.stroke();
      context.beginPath();
      context.moveTo(142, 124);
      context.lineTo(180, 124);
      context.moveTo(164, 105);
      context.lineTo(184, 124);
      context.lineTo(164, 143);
      context.stroke();
      break;
    case 'filter':
      context.beginPath();
      context.moveTo(76, 78);
      context.lineTo(180, 78);
      context.lineTo(140, 124);
      context.lineTo(140, 174);
      context.lineTo(116, 186);
      context.lineTo(116, 124);
      context.closePath();
      context.stroke();
      break;
    case 'policy':
      context.beginPath();
      context.moveTo(90, 66);
      context.lineTo(146, 66);
      context.lineTo(170, 90);
      context.lineTo(170, 184);
      context.lineTo(90, 184);
      context.closePath();
      context.moveTo(146, 66);
      context.lineTo(146, 92);
      context.lineTo(170, 92);
      context.stroke();
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(108, 137);
      context.lineTo(124, 153);
      context.lineTo(154, 116);
      context.stroke();
      break;
    case 'role':
      context.beginPath();
      context.moveTo(128, 64);
      context.lineTo(174, 84);
      context.lineTo(166, 136);
      context.quadraticCurveTo(160, 166, 128, 186);
      context.quadraticCurveTo(96, 166, 90, 136);
      context.lineTo(82, 84);
      context.closePath();
      context.stroke();
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(104, 128);
      context.lineTo(122, 146);
      context.lineTo(154, 108);
      context.stroke();
      break;
    case 'scopeTag':
      context.beginPath();
      context.moveTo(82, 96);
      context.lineTo(122, 70);
      context.lineTo(178, 126);
      context.lineTo(126, 178);
      context.closePath();
      context.stroke();
      context.beginPath();
      context.arc(121, 101, 8, 0, Math.PI * 2);
      context.stroke();
      break;
    case 'signIn':
      context.beginPath();
      context.arc(128, 128, 58, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(104, 128);
      context.lineTo(146, 128);
      context.moveTo(130, 106);
      context.lineTo(152, 128);
      context.lineTo(130, 150);
      context.stroke();
      context.lineWidth = 5;
      context.beginPath();
      context.arc(128, 128, 76, -0.9, 0.6);
      context.stroke();
      break;
    case 'location':
      context.beginPath();
      context.moveTo(128, 188);
      context.quadraticCurveTo(88, 138, 88, 100);
      context.arc(128, 100, 40, Math.PI, 0);
      context.quadraticCurveTo(168, 138, 128, 188);
      context.closePath();
      context.stroke();
      context.beginPath();
      context.arc(128, 104, 15, 0, Math.PI * 2);
      context.stroke();
      break;
  }

  context.restore();
}

function drawAppIconImage(context: CanvasRenderingContext2D, image: HTMLImageElement): void {
  const x = 78;
  const y = 72;
  const size = 100;

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.58)';
  context.shadowBlur = 8;
  context.fillStyle = 'rgba(248, 251, 255, 0.92)';
  context.beginPath();
  context.roundRect(x - 8, y - 8, size + 16, size + 16, 28);
  context.fill();
  context.shadowBlur = 0;
  context.beginPath();
  context.roundRect(x, y, size, size, 22);
  context.clip();
  drawImageCover(context, image, x, y, size, size);
  context.restore();
}

function drawUserPhotoImage(context: CanvasRenderingContext2D, image: HTMLImageElement): void {
  const centerX = 128;
  const centerY = 124;
  const radius = 54;

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.58)';
  context.shadowBlur = 8;
  context.fillStyle = 'rgba(248, 251, 255, 0.92)';
  context.beginPath();
  context.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.clip();
  drawImageCover(context, image, centerX - radius, centerY - radius, radius * 2, radius * 2);
  context.restore();
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  if (!imageWidth || !imageHeight) {
    return;
  }

  const scale = Math.max(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawMonitor(context: CanvasRenderingContext2D): void {
  context.beginPath();
  context.roundRect(74, 78, 108, 72, 10);
  context.stroke();
  context.beginPath();
  context.moveTo(128, 151);
  context.lineTo(128, 172);
  context.moveTo(104, 176);
  context.lineTo(152, 176);
  context.stroke();
}

function tint(color: string, amount: number): string {
  const value = Number.parseInt(color.slice(1), 16);
  const target = amount >= 0 ? 255 : 0;
  const ratio = Math.abs(amount);
  const red = Math.round(((value >> 16) & 255) * (1 - ratio) + target * ratio);
  const green = Math.round(((value >> 8) & 255) * (1 - ratio) + target * ratio);
  const blue = Math.round((value & 255) * (1 - ratio) + target * ratio);
  return `rgb(${red}, ${green}, ${blue})`;
}

function nodeIconCanvasCacheKey(
  kind: IconKind,
  color: string,
  prominent: boolean,
  nodeImage?: HTMLImageElement,
): string {
  const imageKey = nodeImage
    ? `${hashText(nodeImage.src)}:${nodeImage.naturalWidth || nodeImage.width}:${nodeImage.naturalHeight || nodeImage.height}`
    : 'glyph';
  return [kind, color, prominent ? 'prominent' : 'normal', imageKey].join('|');
}

function getCachedCanvas(
  cache: Map<string, HTMLCanvasElement>,
  key: string,
  createCanvas: () => HTMLCanvasElement,
): HTMLCanvasElement {
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const canvas = createCanvas();
  cache.set(key, canvas);
  while (cache.size > maxIconCanvasCacheEntries) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    cache.delete(oldestKey);
  }
  return canvas;
}

function hashText(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}
