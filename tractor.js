window.Artist = Backbone.Model.extend({});

window.ArtistCollection = Backbone.Collection.extend({
  model: Artist,

  initialize: function() {
    _.bindAll(this, "url");
  },

  url: function() {
    return "http://localhost:3000/textract?url=" + escape(this.currentTabUrl);
  }
});

window.ArtistView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, "render");
    this.template = _.template($('#artist-template').html());
  },
  
  render: function(artist) {
    $(this.el).html(this.template(artist.toJSON()));
  }
});
  
window.AppView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, "setArtists", "render");
    this.el = $('#artists');
  },
  
  setArtists: function(artists) {
    this.artists = artists;
    this.artists.bind("refresh", this.render);
    this.artists.fetch();
  },
  
  render: function() {
    var el = this.el;
    this.artists.each(function(artist) {
      var artistListItem = $("<li></li>")
      var artistView = new ArtistView;
      artistView.el = artistListItem;
      artistView.render(artist);
      el.append(artistListItem);
    });
	}
});
