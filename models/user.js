var User	=	Composer.Model.extend({
	type: 'user',

	base_url: '/users',

	logged_in: false,
	latest_feed: null,

	init: function()
	{
		this.logged_in		=	false;
	},

	login: function(data, remember, silent)
	{
		(remember === true) || (remember = false);
		(silent === true) || (silent = false);
		this.set(data);
		this.set({k: this.get_key()});
		this.unset('username');
		this.unset('password');
		this.logged_in	=	true;
		var duration	=	1;
		if(remember)
		{
			duration	=	30;
		}

		this.write_cookie({duration: duration});
		if (!silent) this.trigger('login', this);
	},

	login_from_cookie: function()
	{
		var cookie	=	Cookie.read(config.user_cookie);
		if(cookie == null)
		{
			return false;
		}
		var userdata = JSON.decode(cookie);
		userdata.k = CryptoJS.enc.Hex.parse(userdata.k);
		this.set(userdata);
		this.logged_in	=	true;
		this.trigger('login', this);
	},

	join: function(options)
	{
		options || (options = {});
		tagit.api.post('/users', {data: {a: this.get_auth()}}, {
			success: options.success,
			error: function(e) {
				barfr.barf('Error adding user: '+ e);
				if(options.error) options.error(e);
			}.bind(this)
		});
	},

	write_cookie: function(options)
	{
		options || (options = {});
		var duration	=	options.duration ? options.duration : 30;
		var key			=	this.get_key();
		var auth		=	this.get_auth();
		if(!key || !auth) return false;

		var save		=	{
			id: this.id(),
			k: key.toString(),
			a: auth
		};
		Cookie.write(config.user_cookie, JSON.encode(save), { duration: duration });
	},

	logout: function()
	{
		this.logged_in	=	false;
		this.clear();
		Cookie.dispose(config.user_cookie);
		this.trigger('logout', this);
	},

	get_key: function()
	{
		var key = this.get('k');
		if(key) return key;

		var username = this.get('username');
		var password = this.get('password');

		if(!username || !password) return false;

		var key = tcrypt.key(password, username + ':a_pinch_of_salt', {keySize: 256/32, iterations: 400});

		// cache it
		this.set({k: key});

		return key;
	},

	get_auth: function()
	{
		var auth = this.get('a');
		if(auth) return auth;

		var username = this.get('username');
		var password = this.get('password');

		if(!username || !password) return false;

		var user_record = tcrypt.hash(password) +':'+ username;
		// use username as salt/initial vector
		var key = this.get_key();
		var iv = tcrypt.iv(username);
		var auth =  tcrypt.encrypt(key, user_record, {iv: iv}).toString();

		// cache it
		this.set({a: auth});

		return auth;
	},

	load_profile: function(options)
	{
		options || (options = {});
		var profile = this.get('profile', false);
		if(!profile)
		{
			profile = new Profile();
			this.set({ profile: profile });
		}
		profile.clear({silent: true});
		profile.load(options);
		return profile;
	},

	test_auth: function(options)
	{
		options || (options = {});
		tagit.api.set_auth(this.get_auth());
		tagit.api.post('/auth', {}, {
			success: options.success,
			error: options.error
		});
		tagit.api.clear_auth();
	}
});
