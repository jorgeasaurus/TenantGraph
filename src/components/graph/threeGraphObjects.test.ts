import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  animateFlowObjects,
  animateIlluminationObjects,
  animateParticleFields,
  graphVisualBrillianceScale,
  makeGraphParticleField,
  makeNodeIllumination,
  makeNodeLayers,
  makeRelationshipFlowPulse,
  makeSelectionAnchor,
  renderLayers,
  visualBrillianceOpacity,
} from './threeGraphObjects';

describe('node illumination', () => {
  it('tones additive graph brilliance down by half', () => {
    expect(graphVisualBrillianceScale).toBe(0.5);
    expect(visualBrillianceOpacity(0.74)).toBeCloseTo(0.37);
  });

  it('can brighten and fully hide reset glow objects', () => {
    const illumination = makeNodeIllumination(new THREE.Vector3(0, 0, 0), 20, '#3fd1ff', {
      dimmed: false,
      prominent: false,
    });
    const objects = illumination.illuminationObjects ?? [];

    expect(objects).toHaveLength(2);

    animateIlluminationObjects(objects, 1);
    for (const object of objects) {
      const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
      expect(object.visible).toBe(true);
      expect(material.opacity).toBeGreaterThan(0);
      expect(object.scale.x).toBeGreaterThan(1);
    }

    animateIlluminationObjects(objects, 0);
    for (const object of objects) {
      const material = (object as THREE.Mesh).material as THREE.MeshBasicMaterial;
      expect(object.visible).toBe(false);
      expect(material.opacity).toBe(0);
      expect(object.scale.x).toBe(1);
    }
  });

  it('moves relationship flow markers between source and target', () => {
    const source = new THREE.Vector3(0, 0, 0);
    const target = new THREE.Vector3(100, 0, 0);
    const objects = [makeRelationshipFlowPulse(source, target, '#3fd1ff', 11, true)];

    expect(objects).toHaveLength(1);

    animateFlowObjects(objects, 0.5);
    expect(objects[0].position.x).toBeGreaterThan(0);
    expect(objects[0].position.x).toBeLessThan(100);
    expect(objects[0].position.y).toBeGreaterThan(0);
  });

  it('does not render cone or cylinder spotlight geometry for selected anchors', () => {
    const anchor = makeSelectionAnchor(new THREE.Vector3(0, 0, 0), 24, '#3fd1ff', 9);
    const geometries: THREE.BufferGeometry[] = [];

    anchor.object.traverse((object) => {
      const geometry = (object as THREE.Mesh).geometry;
      if (geometry) {
        geometries.push(geometry);
      }
    });

    expect(geometries.some((geometry) => geometry instanceof THREE.ConeGeometry)).toBe(false);
    expect(geometries.some((geometry) => geometry instanceof THREE.CylinderGeometry)).toBe(false);
  });

  it('uses the brilliance scale for additive node layers', () => {
    const nodeLayers = makeNodeLayers(new THREE.Vector3(0, 0, 0), 20, '#3fd1ff', {
      active: false,
      dimmed: false,
    });
    const materials: THREE.Material[] = [];

    nodeLayers.object.traverse((object) => {
      const material = (object as THREE.Mesh | THREE.Line).material;
      if (Array.isArray(material)) {
        materials.push(...material);
      } else if (material) {
        materials.push(material);
      }
    });

    const opacities = materials
      .map((material) => (material as THREE.Material & { opacity?: number }).opacity)
      .filter((opacity): opacity is number => typeof opacity === 'number');

    expect(opacities).toContain(visualBrillianceOpacity(0.3));
    expect(opacities).toContain(visualBrillianceOpacity(0.18));
  });

  it('creates a subtle capped particle field around the graph', () => {
    const positions = new Map<string, THREE.Vector3>(
      Array.from({ length: 260 }, (_, index) => [
        `node:${index}`,
        new THREE.Vector3(index % 20, 0, Math.floor(index / 20) * 2),
      ]),
    );
    const field = makeGraphParticleField(positions, positions.size);
    const material = field.object.material as THREE.PointsMaterial;
    const geometry = field.object.geometry;
    const positionAttribute = geometry.getAttribute('position');

    expect(positionAttribute.count).toBeGreaterThan(120);
    expect(positionAttribute.count).toBeLessThanOrEqual(520);
    expect(field.object.frustumCulled).toBe(false);
    expect(field.object.renderOrder).toBe(renderLayers.labels - 1);
    expect(material.blending).toBe(THREE.AdditiveBlending);
    expect(material.map).toBeInstanceOf(THREE.Texture);
    expect(material.color.getHexString()).toBe('74e8f5');
    expect(material.opacity).toBe(visualBrillianceOpacity(0.46));
    expect(material.size).toBe(3.4);
    expect(material.sizeAttenuation).toBe(false);
    expect(material.toneMapped).toBe(false);
  });

  it('animates particle fields without changing particle geometry', () => {
    const field = makeGraphParticleField(new Map([['node:1', new THREE.Vector3(0, 0, 0)]]), 1);
    const positionAttribute = field.object.geometry.getAttribute('position');
    const initialY = field.object.position.y;

    animateParticleFields([field.object], 2.4);

    expect(field.object.position.y).not.toBe(initialY);
    expect(field.object.rotation.y).not.toBe(0);
    expect(field.object.geometry.getAttribute('position')).toBe(positionAttribute);
  });
});
