import * as ActionTypes from '../constants/ActionTypes';

export function notificationAdd(level, message, localized = false) {
    return {
        type: ActionTypes.NOTIFICATION_ADD,
        level,
        message,
        localized
    }
}

export function notificationAddSuccess(message, localized = false) {
    return notificationAdd("success", message, localized);
}

export function notificationAddInfo(message, localized = false) {
    return notificationAdd("info", message, localized);
}

export function notificationAddWarning(message, localized = false) {
    return notificationAdd("warning", message, localized);
}

export function notificationAddError(message, localized = false) {
    return notificationAdd("error", message, localized);
}

export function notificationRemove(key) {
    return {
        type: ActionTypes.NOTIFICATION_REMOVE,
        key
    }
}

export function notificationAddClientAPIError(errorAction, errorMessage) {
    return dispatch => {
        dispatch(errorAction);
        if(typeof errorMesages === "string") {
            dispatch(notificationAddError(errorMessages));
        } else {
            errorMessage.body.errors.forEach(function(error) {
                dispatch(notificationAddError(error.message));
            });
        }
    }
}
