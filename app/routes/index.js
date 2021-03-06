import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class IndexRoute extends Route {
  @service session;

  redirect() {
    if (this.session.isAuthenticated) {
      this.transitionTo('days');
    } else {
      this.transitionTo('login');
    }
  }
}
