class VisualArtist {
  constructor(id, name, profile, albums) {
    this.id = id;
    this.name = name;
    this.profile = profile;
    this.albums = albums;
    VisualArtist.all.push(this);
  }

  detail() {
    return this.albums
      .map(album => {
        return `<li>${album.artist} - ${album.title} (${album.year})</li>`;
      })
      .join("");
  }
}

VisualArtist.all = [];
VisualArtist.renderArtists = () => {
  fetch("http://localhost:3003/api/v1/visual_artists/names")
    .then(resp => resp.json())
    .then(json => {
      document.getElementById("filter").innerHTML = json
        .map(name => {
          return `<option value="${name}">`;
        })
        .join("");
    });
};

VisualArtist.domDetail = (albumId, vaId, src) => {
  let nextId = albumId;
  let thisAlbum = Album.page.find(va => {
    return parseInt(va.id) == parseInt(nextId);
  });
  let thisArtist = new VisualArtist(
    thisAlbum.visual_artist.id,
    thisAlbum.visual_artist.name,
    thisAlbum.visual_artist.profile,
    thisAlbum.visual_artist.albums
  );
  let thisSrc = src || thisAlbum.image;
  let bio =
    thisArtist.profile && thisArtist.profile.length
      ? `<h5>Biography</h5><p>${thisArtist.profile}</p>`
      : "";

  let modalContent = `<h6>${thisArtist.name}</h6>
  <p><strong>${bio}</p>
<img src=${thisSrc}>
<ul><span class="albums-header">albums</span>
${thisArtist.detail()}
<ul>`;

  let currentIndex = Album.page.indexOf(
    Album.page.find(album => {
      return album.id === parseInt(albumId);
    })
  );
  if (currentIndex === 19) {
    document.querySelector(".chevron-left").style.visibility = "visible";
    document.querySelector(".chevron-right").style.visibility = "hidden";
  } else if (currentIndex === 0) {
    console.log("yes");
    document.querySelector(".chevron-left").style.visibility = "hidden";
    document.querySelector(".chevron-right").style.visibility = "visible";
  } else {
    document.querySelector(".chevron-left").style.visibility = "visible";
    document.querySelector(".chevron-right").style.visibility = "visible";
  }

  document.querySelector("#modal1 .container").innerHTML = modalContent;
  document.body.addEventListener("keydown", function(e) {
    navigate(e, currentIndex);
  });
  document.querySelectorAll(".modal")[0].addEventListener("click", function(e) {
    navigate(e, currentIndex);
  });
};

VisualArtist.filterAlbums = query => {
  let name = query;
  fetch(`http://localhost:3003/api/v1/visual_artists/filter?name=${name}`)
    .then(resp => resp.json())
    .then(json => {
      let filteredAlbums = [];
      json.forEach(artist => {
        artist.albums.forEach(album => {
          filteredAlbums.push(Album.makeAlbum(album));
        });
      });
      Album.page = filteredAlbums; //////////////////////////////////
      reRender(filteredAlbums);
    });
};
