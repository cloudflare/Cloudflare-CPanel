import http from 'cf-util-http';

import * as ActionTypes from '../constants/ActionTypes';
import { asyncIntlFetchTranslations } from './intl';
import { notificationAddError } from './notifications';
import { isLoggedIn, getEmail } from '../utils/Auth/Auth';
import { asyncUserLoginSuccess } from '../actions/user';

export function configFetch() {
    return {
        type: ActionTypes.CONFIG_FETCH
    }
}

export function configFetchSuccess(config) {
    return {
        type: ActionTypes.CONFIG_FETCH_SUCCESS,
        config
    }
}

export function configFetchError() {
    return {
        type: ActionTypes.CONFIG_FETCH_ERROR,
    }
}

export function asyncConfigFetch() {
    return dispatch => {
        dispatch(configFetch());

        let opts = {};
        opts.headers = {'Accept': 'text/javascript'};
        http.get('./config.js', opts, function (response) {
                let config = JSON.parse(response.text);
                dispatch(configFetchSuccess(config));
                dispatch(asyncIntlFetchTranslations(config.locale))
                //log user in if their email is in local storage
                if(isLoggedIn()) {
                    dispatch(asyncUserLoginSuccess(getEmail()));
                }

            },
            function (error) {
                dispatch(configFetchError());
                dispatch(notificationAddError(error));
            });
    }
}