import { hash } from 'rsvp';
import Ember from 'ember';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import moment from 'moment';
import { task, timeout } from 'ember-concurrency';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  flashMessages: service(),
  selectedDate: service(),

  queryParams: {
    date: { refreshModel: true }
  },

  model(params) {
    let date = params.date ? moment(params.date) : moment();
    let selectedDateService = this.get('selectedDate');
    selectedDateService.set('date', date);
    return hash({
      date,
      days: this.store.query('list', {
        include: 'tasks',
        filter: {
          'list-type': 'day',
          date: selectedDateService.get('dates').map((date) => date.format('YYYY-MM-DD'))
        },
        sort: 'name'
      }),
      lists: this.store.query('list', {
        include: 'tasks',
        filter: {
          'list-type': 'list'
        }
      })
    });
  },

  pollForChanges: task(function* () {
    if (Ember.testing) {
      return;
    }
    yield timeout(5000);
    let selectedDateService = this.get('selectedDate');
    this.store.query('list', {
      include: 'tasks',
      filter: {
        'list-type': 'day',
        date: selectedDateService.get('dates').map((date) => date.format('YYYY-MM-DD'))
      }
    })
      .then((results) => this.get('controller.model.days').addObjects(results))
      .catch((err) => this.get('flashMessages').error(`Failed to fetch days: ${err}`));

    this.get('pollForChanges').perform();
  }).on('activate').cancelOn('deactivate').restartable(),

  actions: {
    pausePolling() {
      this.get('pollForChanges').cancelAll();
    },
    resumePolling() {
      this.get('pollForChanges').perform();
    }
  }
});
