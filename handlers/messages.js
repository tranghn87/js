var messages = {
	index: function()
	{
		if(!turtl.profile.profile_loaded)
		{
			turtl.controllers.pages.trigger('loaded');
			return;
		}
		turtl.controllers.pages.load(MessagesController);
	}
};
