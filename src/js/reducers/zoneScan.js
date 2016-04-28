import { normalize, Schema, arrayOf } from 'normalizr';
import _ from 'lodash';
import * as ActionTypes from '../constants/ActionTypes';

const initialState = {
    entities: {},
    isFetching: false
};


export function zoneScanReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.ZONE_FETCH_SCAN:
            return Object.assign({}, state, {
                isFetching: true
            })
        case ActionTypes.ZONE_FETCH_SCAN_SUCCESS:
            return Object.assign({}, state, {
                entities: patchEntity(action.zoneId, action.zoneScan, state),
                isFetching: false
            })
        case ActionTypes.ZONE_FETCH_SCAN_ERROR:
            return Object.assign({}, state, {
                isFetching: false
            })
        case ActionTypes.ZONE_UPDATE_SCAN:
            return Object.assign({}, state, {
                entities: patchEntity(action.zoneId, action.zoneScan, state),
                isFetching: true
            })
        case ActionTypes.ZONE_UPDATE_SCAN_SUCCESS:
            return Object.assign({}, state, {
                entities: patchEntity(action.zoneId, action.zoneScan, state),
                isFetching: false
            })
        case ActionTypes.ZONE_UPDATE_SCAN_ERROR:
            return Object.assign({}, state, {
                entities: patchEntity(action.zoneId, action.zoneScan, state),
                isFetching: false
            })
        default:
            return state;
    }
}

function patchEntity(zoneId, zoneScan, state) {
    let entities = state.entities;
    entities[zoneId] = zoneScan;
    return entities;
}