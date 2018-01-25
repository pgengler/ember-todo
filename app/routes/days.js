import { hash } from 'rsvp';
import Ember from 'ember';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import moment from 'moment';
import { task, timeout } from 'ember-concurrency';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

function datesAround(date) {
  let days = [
    moment(date).subtract(1, 'day'),
    date,
    ...[1, 2, 3].map((val) => moment(date).add(val, 'days'))
  ];
  return days.map((day) => day.format('YYYY-MM-DD'));
}

export default Route.extend(AuthenticatedRouteMixin, {
  flashMessages: service(),

  queryParams: {
    date: { refreshModel: true }
  },

  model(params) {
    let date = params.date ? moment(params.date) : moment();
    return hash({
      days: this.store.query('list', {
        include: 'tasks',
        filter: {
          'list-type': 'day',
          date: datesAround(date)
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
    this.store.query('list', {
      include: 'tasks',
      filter: {
        'list-type': 'day',
        date: datesAround(this.get('controller.date') || moment())
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
