import React, { Component } from 'react';
import {Route, withRouter} from 'react-router-dom';
import auth0Client from './Auth';
import NavBar from './NavBar/NavBar';
import Lobby from './Lobby/Lobby';
import Callback from './Callback';
import SecuredRoute from './SecuredRoute/SecuredRoute';
import Game from "./Game/Game";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checkingSession: true,
    }
  }

  async componentDidMount() {
    if (this.props.location.pathname === '/callback') {
      this.setState({checkingSession:false});
      return;
    }
    try {
      await auth0Client.silentAuth();
      this.forceUpdate();
    } catch (err) {
      if (err.error !== 'login_required') console.log(err.error);
    }
    this.setState({checkingSession:false});
  }

  render() {
    return (
      <div>
        <NavBar/>
        <SecuredRoute path="/" component={Lobby}
            checkingSession={this.state.checkingSession}/>
        <SecuredRoute path="/game" component={Game}
            checkingSession={this.state.checkingSession}/>
        <Route exact path="/callback" component={Callback}/>
      </div>
    );
  }
}

export default withRouter(App);
