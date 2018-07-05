class Album {
  constructor(
    id,
    artist,
    title,
    image,
    year,
    rating,
    likes,
    visual_artist,
    genres
  ) {
    this.id = id;
    this.artist = artist;
    this.title = title;
    this.image = image;
    this.year = year;
    this.rating = rating;
    this.likes = likes;
    this.visual_artist = visual_artist;
    this.genres = genres;
    Album.fetched.push(this);
    Album.concat.push(
      Object.assign(
        {},
        {
          id: this.id,
          body: `${this.artist}
              ${this.title}
              ${this.image}
              ${this.year}
          `
        }
      )
    );
  }

  render() {
    // debugger;
    let clicked = JSON.parse(localStorage.getItem("liked")).includes(
      this.id.toString()
    );
    let likeHTML = !clicked
      ? `<span class="heart" data-id="${this.id}" class="like">💜</span>like it`
      : ``;
    return `<summary class="perm">
          <h6 class="visual-artist">${this.visual_artist.name}</h6>
          <div class="image-container"><a class="tooltipped" data-position="top" data-tooltip="${
            this.artist
          } - ${this.title} (${this.year})"><img src='${
      this.image
    }' class="image modal-trigger" data-id="${this.id}" data-artist="${
      this.visual_artist.id
    }" data-target="modal1" ></a></div>
          <!--<div class="artist">${this.artist}</div>
          <div class="title">${this.title}</div>
          <div class="year">${this.year}</div>
          <div><button class="delete" data-id="${
            this.id
          }">delete</button></div>//-->

          <div class="like-it">${likeHTML}<br><span class="likes">${parseInt(
      this.likes
    )}</span> likes</div>
        </summary>`;
  }

  tempRender() {
    let genres = this.genres.map(genre => genre.name).join(",");
    return `<summary class="temp">
        <h6 class="visual-artist">${this.visual_artist.name}</h6>
        <div class="image-container"><a class="tooltipped" data-position="top" data-tooltip="${
          this.artist
        } - ${this.title} (${this.year})"><img src='${
      this.image
    }' class="image" data-target="modal1" ></a></div>
        <div class="add-it">
        <button class="btn" type="submit" name="action" data-artist="${
          this.artist
        }" data-title="${this.title}" data-year="${
      this.year
    }" data-artist-name="${this.visual_artist.name}" data-artist-profile="${
      this.visual_artist.profile
    }" data-image="${this.image}" data-genres="${genres}" data-likes="${
      this.likes
    }" data-rating="${this.rating}">add art
            <i class="material-icons right">add_box</i>
        </button>
        </div>
      </summary>`;
  }
}
Album.fetched = [];
Album.page = [];
Album.concat = [];
Album.updateLikes = id => {
  const albumJson = "http://localhost:3003/api/v1/albums";
  fetch(`${albumJson}/${id}`, {
    body: JSON.stringify(id),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    method: "PATCH"
  }).then(resp => console.log(resp));
};

Album.makeAlbum = album => {
  return new Album(
    album.id,
    album.artist,
    album.title,
    album.image,
    album.year,
    album.rating,
    album.likes,
    album.visual_artist,
    album.genres
  );
};

Album.deleteIt = () => {
  const albumJson = "http://localhost:3003/api/v1/albums";
  document.querySelector("article").addEventListener("click", function(e) {
    if (e.target.className.includes("delete")) {
      e.target.parentNode.parentNode.remove();
      let id = e.target.dataset.id;
      fetch(`${albumJson}/${id}`, {
        body: JSON.stringify(id),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        method: "DELETE"
      }).then(resp => console.log(resp));
    }
  });
};

Album.searchAlbums = query => {
  let name = query;
  fetch(`http://localhost:3003/api/v1/albums/search?name=${name}`)
    .then(resp => resp.json())
    .then(json => {
      let filteredAlbums = [];
      json.forEach(album => {
        filteredAlbums.push(Album.makeAlbum(album));
      });
      Album.page = filteredAlbums; //////////////////////////////////
      reRender(filteredAlbums);
    });
};
