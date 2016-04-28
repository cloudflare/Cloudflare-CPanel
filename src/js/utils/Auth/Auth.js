import _ from 'lodash';

export function isLoggedIn() {
    if(_.isEmpty(localStorage.cfEmail)) {
        return false;
    }
    return true;
}

export function getEmail() {
    return localStorage.cfEmail;
}

export function setEmail(email) {
    localStorage.cfEmail = email;
}