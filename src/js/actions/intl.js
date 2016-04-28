import http from 'cf-util-http';

import * as ActionTypes from '../constants/ActionTypes';
import { applicationInit } from './app';
import { notificationAddError } from './notifications';


export function intlFetchTranslations() {
    return {
        type: ActionTypes.INTL_FETCH_TRANSLATIONS
    }
}

export function intlFetchTranslationsSuccess(locale, translations) {
    return {
        type: ActionTypes.INTL_FETCH_TRANSLATIONS_SUCCESS,
        locale,
        translations
    }
}

export function intlFetchTranslationsError(error) {
    return {
        type: ActionTypes.INTL_FETCH_TRANSLATIONS_ERROR,
        error
    }
}

export function asyncIntlFetchTranslations(locale) {
    return dispatch => {
        dispatch(intlFetchTranslations());

        let opts = {};
        opts.headers = {'Accept': 'text/javascript'};
        http.get('./lang/'+locale+'.js',opts,function(response) {
                let translations = JSON.parse(response.text);
                dispatch(intlFetchTranslationsSuccess(locale, translations));
                dispatch(applicationInit());
            },
            function(error) {
                dispatch(notificationAddError(error));
            });

    }
}