window.daysOfTheWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
window.months = ['Jan','Feb','Mar','Apr','May','Jun', 'Jul','Aug','Sep','Oct','Nov','Dec'];


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

window.Event = Backbone.Model.extend({});

window.Calendar = Backbone.Collection.extend({
  model: Event,

  initialize: function() {
    _.bindAll(this, "url");
  },

  url: function() {
    return "http://api.songkick.com/api/3.0/artists/mbid:" + escape(this.musicbrainzID) + "/calendar.json?apikey=musichackday";
  },

  parse: function(response) {
    return response.resultsPage.results.event;
  }
});

window.SongkickCalendarView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, "setCalendar", "render");
  },

  render: function() {
    var el = this.el;
    this.calendar.each(function(event) {
      var date = new Date(event.get("start").date);
      var venueOrFestivalName = (event.get("type")   === "Festival" ? event.get("displayName") : event.get("venue").displayName)
      var calendarListItem = $(
        "<tr>\n<td class=\"calendar\">\n<span class=\"day\">" +
          window.daysOfTheWeek[date.getDay()] +
          "</span>\n<span class=\"day-of-month\">" +
          date.getDate() +
          "</span><span class=\"month\">" +
          window.months[date.getMonth()] +
          "</span>\n</td>\n<td class=\"location\">\n<strong>" +
          venueOrFestivalName +
          "</strong>" +
          event.get("location").city +
          "</td>\n</tr>"
      );
      el.append(calendarListItem);
    });
  },

  setCalendar: function(calendar) {
    this.calendar = calendar;
    this.calendar.bind("refresh", this.render);
    this.calendar.fetch();
  }
});

window.ArtistView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, "render");
    this.template = _.template($('#artist-template').html());
  },
  
  render: function(artist) {
    $(this.el).html(this.template(artist.toJSON()));
    
    var calendar = new Calendar;
    calendar.musicbrainzID = artist.attributes.mbid;
    
    var songkickCalendarView = new SongkickCalendarView;
    songkickCalendarView.el = this.$('.songkick-listing');
    songkickCalendarView.setCalendar(calendar);
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
