import Ember from 'ember';

export default Ember.Component.extend({
	tagName: 'form',
	submitButtonLabel: 'Submit',
	submitButtonClass: '',

	submit: function(event) {
		this.sendAction();
		return false;
	},

	actions: {
		cancel: function() {
			this.sendAction('cancel');
		}
	}
});