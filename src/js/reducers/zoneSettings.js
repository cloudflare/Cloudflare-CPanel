import { normalize, Schema, arrayOf } from 'normalizr';
import _ from 'lodash';
import * as ActionTypes from '../constants/ActionTypes';

const initialState = {
    entities: {},
    result: [],
    isFetching: ""
};


export function zoneSettingsReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.ZONE_FETCH_SETTINGS:
            return Object.assign({}, state, {
                isFetching: "fetchAllSettings"
            })
        case ActionTypes.ZONE_FETCH_SETTINGS_SUCCESS:
            let zoneSettingSchema = new Schema(action.zoneId, {idAttribute: 'id'});
            let normalizedZoneSettings = normalize(action.zoneSettings, arrayOf(zoneSettingSchema));

            return Object.assign({}, state, {
                entities: _.merge(state.entities, normalizedZoneSettings.entities),
                result: _.merge(state.result, normalizedZoneSettings.result),
                isFetching: ""
            })
        case ActionTypes.ZONE_FETCH_SETTINGS_ERROR:
            return Object.assign({}, state, {
                isFetching: ""
            })
        case ActionTypes.ZONE_UPDATE_SETTING:
            return Object.assign({}, state, {
                entities: patchSetting(action.zoneId, action.setting, state),
                isFetching: action.setting.id
            })
        case ActionTypes.ZONE_UPDATE_SETTING_SUCCESS:
            return Object.assign({}, state, {
                entities: patchSetting(action.zoneId, action.setting, state),
                isFetching: ""
            })
        case ActionTypes.ZONE_UPDATE_SETTING_ERROR:
            return Object.assign({}, state, {
                entities: patchSetting(action.zoneId, action.setting, state),
                isFetching: ""
            })
        default:
            return state;
    }
}

function patchSetting(zoneId, setting, state) {
    let patchedEntities = state.entities;
    patchedEntities[zoneId][setting.id] = setting;
    return patchedEntities;
}
