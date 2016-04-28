import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';

import { asyncZoneActivationCheck } from '../../actions/zoneProvision';
import { Card, CardSection, CardContent, CardControl, CardDrawers } from 'cf-component-card';
import { Button } from 'cf-component-button';
import { List, ListItem } from 'cf-component-list';

class ActivationCheckCard extends Component {


    handleButtonClick() {
        let { activeZone, dispatch } = this.props;
        dispatch(asyncZoneActivationCheck(activeZone.id));
    }

    render() {
        const { formatMessage } = this.props.intl;
        let { zone } = this.props;

        return (
            <div>
                <Card>
                    <CardSection>
                        <CardContent  title={formatMessage({id: 'container.activationCheckCard.title'})}>
                            <p><FormattedMessage id="container.activationCheckCard.status" values={ {status: zone.status} }/></p>
                            <p><FormattedMessage id="container.activationCheckCard.nameServers"/></p>
                            <List>
                                {zone.name_servers.map(nameserver =>
                                    <ListItem key={nameserver}>{nameserver}</ListItem>
                                )}
                            </List>
                            <p><FormattedMessage id="container.activationCheckCard.description" /></p>
                        </CardContent>
                        <CardControl>
                            <Button type="success" onClick={ this.handleButtonClick.bind(this) }>
                                <FormattedMessage id="container.activationCheckCard.button"/>
                            </Button>
                        </CardControl>
                    </CardSection>
                </Card>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        activeZone: state.activeZone,
        zone: state.zones.entities.zones[state.activeZone.name]
    }
}
export default injectIntl(connect(mapStateToProps)(ActivationCheckCard));

