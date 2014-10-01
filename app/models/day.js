import DS from 'ember-data';

export default DS.Model.extend({
	date: DS.attr('date'),
	items: DS.hasMany('item', { async: true })
});
