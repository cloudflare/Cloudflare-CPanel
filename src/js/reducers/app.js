import * as ActionTypes from '../constants/ActionTypes';

const initialState = {
    isInitialized: false
};

export function appReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.APPLICATION_INIT:
            return Object.assign({}, state, {
                isInitialized: true
            });
        default:
            return state;
    }
}