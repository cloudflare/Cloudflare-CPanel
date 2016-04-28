import * as ActionTypes from '../constants/ActionTypes';

const initialState = [];

export function notificationsReducer(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.NOTIFICATION_ADD:
            return [
                {
                    key: Date.now(),
                    level: action.level,
                    message: action.message,
                    localized: action.localized
                },
                ...state
            ];
        case ActionTypes.NOTIFICATION_REMOVE:
            return state.filter(notification => notification.key !== action.key);
        default:
            return state;
    }
}