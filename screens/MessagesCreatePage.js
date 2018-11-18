import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Select2 from '../../../components/Form/Select2';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

class MessagesCreatePage extends Component {
  static contextTypes = {
    router: PropTypes.object,
  };

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    notifications: PropTypes.array,
    intl: PropTypes.object.isRequired,
    addUser: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      active: 'msg_list',
      invitedUsers: [],
    };
  }

  handleNickChange = (invitedUsers) => {
    this.setState({ invitedUsers });
  };

  render() {
    return (
      <Grid container spacing={8}>
        <Grid item xs={12}>
          <Typography variant="body1">{this.props.intl.messages.create_conversation_description}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Select2 name="nick" type="text"
            placeholder={this.props.intl.messages.add_user}
            label={this.props.intl.messages.select2_label}
            value={this.state.invitedUsers}
            onInputChange={this.handleNickChange}
            multiselect
            listtype="Account"
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="title" className="mb-2" align="center">
            <Button className={`btn ${this.state.invitedUsers.length > 0 ? 'btn btn-outline-secondary' : 'btn btn-outline-secondary disabled'}`}
              onClick={() => this.props.addUser(this.state.invitedUsers.map(a => a._id), false)}
              fullWidth
              color="primary"
              type="submit"
            >
              {this.props.intl.messages.create_conversation}
            </Button>
          </Typography>
        </Grid>
      </Grid>
    );
  }
}

// Retrieve data from store as props
function mapStateToProps(store) {
  return {
    intl: store.intl,
    user: store.user,
  };
}

export default connect(mapStateToProps)(MessagesCreatePage);
