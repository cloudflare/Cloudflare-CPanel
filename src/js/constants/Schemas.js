import { normalize, Schema, arrayOf } from 'normalizr';

export const zoneSchema = new Schema('zones', { idAttribute: 'name' });
export const zoneRailgunSchema = new Schema('railguns', { idAttribute: 'id' });

export function normalizeZoneGetAll(result) {
    return normalize(result, arrayOf(zoneSchema));
}

export function normalizeZoneRailgunGetAll(result) {
    return normalize(result, arrayOf(zoneRailgunSchema));
}
