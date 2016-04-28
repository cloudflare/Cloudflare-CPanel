import _ from 'lodash';
import * as ActionTypes from '../constants/ActionTypes';
import { normalizeZoneGetAll } from '../constants/Schemas';

const initialState = {
    entities: {},
    result: {},
    zoneDeleteIsFetching: false,
    zoneFetchIsFetching: false,
    zoneProvisionCnameIsFetching: false,
    zoneProvisionFullIsFetching: false
};

export function zonesReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.ZONES_DELETE_ZONE:
            return Object.assign({}, state, {
                zoneDeleteIsFetching: true
            })
        case ActionTypes.ZONES_DELETE_ZONE_SUCCESS:
            return Object.assign({}, state, {
                zoneDeleteIsFetching: false
            })
        case ActionTypes.ZONES_DELETE_ZONE_ERROR:
            return Object.assign({}, state, {
                zoneDeleteIsFetching: false
            })
        case ActionTypes.ZONES_FETCH:
            return Object.assign({}, state, {
                zoneFetchIsFetching: true
            })
        case ActionTypes.ZONES_FETCH_SUCCESS:
            let normalizedZoneList = normalizeZoneGetAll(action.zoneList);

            return Object.assign({}, state, {
                entities: _.merge(state.entities, normalizedZoneList.entities),
                result: _.merge(state.result, normalizedZoneList.result),
                zoneFetchIsFetching: false
            })
        case ActionTypes.ZONES_FETCH_ERROR:
            return Object.assign({}, state, {
                zoneFetchIsFetching: false
            })
        case ActionTypes.ZONES_PROVISION_CNAME:
            return Object.assign({}, state, {
                zoneProvisionCnameIsFetching: true
            })
        case ActionTypes.ZONES_PROVISION_CNAME_SUCCESS:
            return Object.assign({}, state, {
                zoneProvisionCnameIsFetching: false
            })
        case ActionTypes.ZONES_PROVISION_CNAME_ERROR:
            return Object.assign({}, state, {
                zoneProvisionCnameIsFetching: false
            })
        case ActionTypes.ZONES_PROVISION_FULL:
            return Object.assign({}, state, {
                zoneProvisionFullIsFetching: true
            })
        case ActionTypes.ZONES_PROVISION_FULL_SUCCESS:
            return Object.assign({}, state, {
                zoneProvisionFullIsFetching: false
            })
        case ActionTypes.ZONES_PROVISION_FULL_ERROR:
            return Object.assign({}, state, {
                zoneProvisionFullIsFetching: false
            })
        default:
            return state;
    }
}