import * as ActionTypes from '../constants/ActionTypes';

const initialState = {
    id: "",
    name: "",
};

export function activeZoneReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.ZONES_SET_ACTIVE_ZONE:
            return Object.assign({}, state, {
                id: action.zone.id,
                name: action.zone.name
            })
        default:
            return state;
    }
}
