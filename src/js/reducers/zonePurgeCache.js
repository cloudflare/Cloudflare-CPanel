import * as ActionTypes from '../constants/ActionTypes';
import _ from 'lodash';

const initialState = {
    isFetching: false
};

export function zonePurgeCacheReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.ZONE_PURGE_CACHE:
            return Object.assign({}, state, {
                isFetching: true
            })
        case ActionTypes.ZONE_PURGE_CACHE_SUCCESS:
            return Object.assign({}, state, {
                isFetching: false
            })
        case ActionTypes.ZONE_PURGE_CACHE_ERROR:
            return Object.assign({}, state, {
                isFetching: false
            })
        default:
            return state;
    }
}