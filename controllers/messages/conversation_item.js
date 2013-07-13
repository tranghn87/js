var ConversationItemController = Composer.Controller.extend({
	tag: 'li',

	elements: {
	},

	events: {
		'click': 'select_conversation'
	},

	model: null,

	init: function()
	{
		if(!this.model) return false;
		this.render();
		this.model.bind(['personas', 'change'], this.render.bind(this), 'conversations:item:render');
	},

	release: function()
	{
		this.model.unbind(['personas', 'change'], 'conversations:item:render');
		this.unbind('select', 'conversations:item:select');
		return this.parent.apply(this, arguments);
	},

	render: function()
	{
		var personas		=	this.model.get('personas');
		var my_personas		=	personas.select({mine: true})
			.map(function(p) { return toJSON(p); });
		var their_personas	=	personas.filter(function(p) { return !p.get('mine', false); })
			.map(function(p) { return toJSON(p); });
		var content = Template.render('messages/conversation_item', {
			conversation: toJSON(this.model),
			my_personas: my_personas,
			their_personas: their_personas
		});
		this.html(content);
		this.className = 'conversation_'+this.model.id();
	},

	select_conversation: function(e)
	{
		if(e) e.stop();
		this.trigger('select', this.model, this.el);
	}
});