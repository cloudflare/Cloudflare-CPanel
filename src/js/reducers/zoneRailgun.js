import _ from 'lodash';

import * as ActionTypes from '../constants/ActionTypes';
import { normalizeZoneRailgunGetAll } from '../constants/Schemas';

const initialState = {
    entities: {},
    isFetching: false
};


export function zoneRailgunReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.ZONE_RAILGUNS_FETCH_ALL:
            return Object.assign({}, state, {
                isFetching: true
            });
        case ActionTypes.ZONE_RAILGUNS_FETCH_ALL_SUCCESS:
            let normalizedZoneRailguns = normalizeZoneRailgunGetAll(action.zoneRailguns);
            let newEntities = Object.assign({}, state.entities);
            newEntities[action.zoneId] = normalizedZoneRailguns.entities.railguns;

            return Object.assign({}, state, {
                entities: newEntities,
                isFetching: false
            });
        case ActionTypes.ZONE_RAILGUNS_FETCH_ALL_ERROR:
            return Object.assign({}, state, {
                isFetching: false
            });
        case ActionTypes.ZONE_RAILGUNS_CONNECTION_UPDATE:
            return Object.assign({}, state, {
                entities: getPatchedEntities(state, action),
                isFetching: true
            });
        case ActionTypes.ZONE_RAILGUNS_CONNECTION_UPDATE_SUCCESSS:
            return Object.assign({}, state, {
                entities: getPatchedEntities(state, action),
                isFetching: false
            });
        case ActionTypes.ZONE_RAILGUNS_CONNECTION_UPDATE_ERROR:
            return Object.assign({}, state, {
                entities: getPatchedEntities(state, action),
                isFetching: false
            });
        default:
            return state;
    }
}

function getPatchedEntities(state, action) {
    let patchedEntities = Object.assign({}, state.entities);
    patchedEntities[action.zoneId][action.zoneRailgun.id] = action.zoneRailgun;
    return patchedEntities;
}