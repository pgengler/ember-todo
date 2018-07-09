import { computed } from '@ember/object';
import DS from 'ember-data';

export default DS.Model.extend({
  done: DS.attr('boolean'),
  description: DS.attr('string'),
  list: DS.belongsTo('list'),
  sortOrder: DS.attr('number'),

  isDone: computed('done', {
    get() {
      return this.get('done');
    },
    set(key, value) {
      this.set('done', value);
      this.save();
      return value;
    }
  }),

  plaintextDescription: computed('description', function() {
    return this.get('description').replace(/[^A-Za-z0-9]/g, '');
  })
});
