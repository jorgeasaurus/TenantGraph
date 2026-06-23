import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  animateFlowObjects,
  animateIlluminationObjects,
  makeNodeIllumination,
  makeRelationshipFlowPulse,
  makeSelectionAnchor,
} from './threeGraphObjects';

describe('node illumination', () => {
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
});
