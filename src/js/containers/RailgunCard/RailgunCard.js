import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import _ from 'lodash';

import { Button } from 'cf-component-button';
import { Card, CardSection, CardContent, CardControl, CardDrawers } from 'cf-component-card';
import { Table, TableHead, TableBody, TableFoot, TableRow, TableHeadCell, TableCell } from 'cf-component-table';
import Toggle from 'cf-component-toggle';

import { asyncZoneRailgunConnectionUpdate } from '../../actions/zoneRailgun';

class RailgunCard extends Component {

    handleToggle(e, railgun) {
        let { activeZone, dispatch } = this.props;
        dispatch(asyncZoneRailgunConnectionUpdate(activeZone.id, railgun, e));
    }

    render() {
        const { formatMessage } = this.props.intl;
        let { railguns, activeZone } = this.props;
        let isRailgunListEmpty = _.isEmpty(railguns);
        return (
            <div>
                <Card>
                    <CardSection>
                        <CardContent  title={formatMessage({id: 'container.railgunCard.title'})}>
                            <p><FormattedMessage id="container.railgunCard.description" /></p>
                        </CardContent>
                        <CardControl></CardControl>
                    </CardSection>
                    <CardSection>
                        {isRailgunListEmpty && (<p><FormattedMessage id="container.railgunCard.noRailgunsAvailable" values={{'zoneName': activeZone.name}} /></p>)}
                        {!isRailgunListEmpty && (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableHeadCell><FormattedMessage id="container.railgunCard.table.name" /></TableHeadCell>
                                        <TableHeadCell><FormattedMessage id="container.railgunCard.table.railgunState" /></TableHeadCell>
                                        <TableHeadCell><FormattedMessage id="container.railgunCard.table.connectedToWebsite" /></TableHeadCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                {_.values(railguns).map(railgun =>
                                    <TableRow key={railgun.id}>
                                        <TableCell>{ railgun.name }</TableCell>
                                        <TableCell>{ (railgun.active ? <FormattedMessage id="container.railgunCard.table.active" /> : <FormattedMessage id="container.railgunCard.table.inactive" />)}</TableCell>
                                        <TableCell>
                                            <Toggle
                                                label=""
                                                name={railgun.name + "_connected"}
                                                value={railgun.connected}
                                                onChange={(e) => this.handleToggle(e, railgun)}/>
                                        </TableCell>
                                    </TableRow>
                                )}
                                </TableBody>
                            </Table>
                        )}
                    </CardSection>
                </Card>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        activeZone: state.activeZone,
        railguns: state.zoneRailguns.entities[state.activeZone.id]
    }
}
export default injectIntl(connect(mapStateToProps)(RailgunCard));

