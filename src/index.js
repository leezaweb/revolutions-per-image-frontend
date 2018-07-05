let search = false;
let liked;
let tapInstance;

document.addEventListener("DOMContentLoaded", () => {
  tapInstance = M.TapTarget.init(document.querySelectorAll(".tap-target"))[0];
  myStorage = window.localStorage;
  liked = [];

  Album.deleteIt();
  M.Autocomplete.init(document.querySelectorAll(".autocomplete"), {});

  Genre.renderChips();
  VisualArtist.renderArtists();
  reRender();

  document
    .getElementById("sort")
    .addEventListener("click", clickSort.bind(this));
  document
    .getElementById("chips")
    .addEventListener("click", clickChip.bind(this));
  document
    .getElementById("searchForm")
    .addEventListener("submit", searchIt.bind(this));
  document
    .getElementById("filterForm")
    .addEventListener("submit", filterIt.bind(this));
  document
    .getElementById("addForm")
    .addEventListener("submit", searchArtist.bind(this));
  document
    .querySelector("article")
    .addEventListener("click", clickIt.bind(this));

  document
    .querySelector(".discover-it")
    .addEventListener("click", discoverIt.bind(this, tapInstance));

  let modalInstance = M.Modal.init(document.querySelectorAll(".modal"));
  document.querySelector(".chevron-left").style.visibility = "hidden";
  document.querySelector(".chevron-right").style.visibility = "hidden";
  document.querySelector("main").addEventListener("click", function(e) {
    tapInstance.close();
    search = false;
  });
});

let token = "QjkhoqmubxdAFOTXhcXCnhdQzozszdFQOjFVltZN";
let count = 0;
var selected = [];

function searchArtist(e) {
  e.preventDefault();
  scrollToTop();
  clearSelected();
  tapInstance.close();
  search = false;
  Album.fetched = [];
  document.querySelector("article").innerHTML = "";
  document.querySelector(".pager").style.display = "none";
  let query = document.getElementById("add").value.toLowerCase();

  let promise = fetch(
    `https://api.discogs.com/database/search?q=${query}&page=1&credit&token=${token}`
  )
    // json.pagination.pages

    .then(resp => resp.json())
    .then(json => {
      document.querySelector(".progress-spinner").style.display = "block";
      let promises = json.results
        .slice(0, 25)
        .filter(result => {
          return result.resource_url.includes("releases");
        })
        .map(result => {
          let fetched = fetcher(result.resource_url).then(album => {
            if (album !== undefined) {
              return makeTempAlbum(album);
            }
          });
          return fetched;
        });
      return Promise.all(promises).then(function(values) {
        return values;
      });
    });
  Promise.resolve(promise).then(function(values) {
    document.querySelector(".progress-spinner").style.display = "none";
    let selected = values.filter(v => v !== undefined);
    tempAdd(selected);
    checkCount();
  });

  document.getElementById("addForm").reset();
}

function tempAdd(selected) {
  selected.forEach(album => {
    document.querySelector("article").innerHTML += album.tempRender();
  });
}

function makeTempAlbum(album) {
  let artist = album.extraartists.find(ea => {
    return ea.role.match(/\b(Cover|Painting|Artwork|Illustration|Drawing)\b/gi);
  });

  let genres = [];

  if (album.genres) album.genres.forEach(genre => genres.push(genre));
  if (album.styles) album.styles.forEach(genre => genres.push(genre));

  let artistObj = new VisualArtist(null, artist.name);

  genreObjs = genres.map(genre => {
    return new Genre(null, genre);
  });
  if (album.images) {
    return new Album(
      null,
      album.artists_sort,
      album.title,
      album.images[0].uri,
      album.year,
      album.community.rating.average,
      album.community.rating.count,
      artistObj,
      genreObjs
    );
  }
}

function fetcher(result) {
  var fetched = fetchAlbum(result);
  // debugger;
  return fetched;
}

// async function fetcher(result){
//   var fetched = await fetchAlbum(result);
//   // debugger;
//   return fetched;
// }

function fetchAlbum(result) {
  let counter = 0;
  // setTimeout(() => {
  return fetch(`${result}?token=${token}`)
    .then(resp => resp.json())
    .then(json => {
      counter = json.extraartists.filter(va => {
        return va.role.match(
          /\b(Cover|Painting|Artwork|Illustration|Drawing)\b/gi
        );
      }).length;
      if (counter > 0) {
        return json;
      }
    });
  // }, 2000);
}

function clickSort(e) {
  clearSelected();
  if (e.target.className.includes("like-sort")) {
    reRender("likes");
  } else if (e.target.className.includes("year-sort")) {
    reRender("year");
  } else if (e.target.className.includes("refresh-sort")) {
    reRender();
  }
}

function discoverIt(tapInstance, e) {
  if (e.target.className.includes("discovery")) {
    toggleDiscovery(tapInstance);
  }
}

function toggleDiscovery(tapInstance) {
  if (search === false) {
    tapInstance.open();
    search = true;
  } else {
    tapInstance.close();
    search = false;
  }
  document
    .querySelectorAll(".pulse")
    .forEach(pulse => pulse.classList.toggle("pulse"));
}

function clickIt(e) {
  if (e.target.className.includes("image")) {
    let src = e.target.src;
    let vaId = e.target.dataset.artist;
    let albumId = e.target.dataset.id;

    VisualArtist.domDetail(albumId, vaId, src);
  } else if (e.target.className.includes("heart")) {
    e.target.parentElement.getElementsByClassName("likes")[0].innerHTML++;
    let id = e.target.dataset.id;
    liked.push(id);
    e.target.nextSibling.nextSibling.remove();
    e.target.nextSibling.remove();
    e.target.remove();

    myStorage.setItem("liked", JSON.stringify(liked));
    Album.updateLikes(id);
  } else if (e.target.parentElement.className.includes("add")) {
    let data = {
      artist: e.target.dataset.artist,
      title: e.target.dataset.title,
      image: e.target.dataset.image,
      year: e.target.dataset.year,
      rating: e.target.dataset.rating,
      likes: e.target.dataset.likes,
      visual_artist: e.target.dataset.artistName,
      genres: e.target.dataset.genres
    };

    let promise = fetch("http://localhost:3003/api/v1/albums", {
      body: JSON.stringify(data),
      method: "POST",
      headers: {
        "user-agent": "Mozilla/4.0 MDN Example",
        "content-type": "application/json"
      }
    });

    Promise.resolve(promise).then(function() {
      VisualArtist.filterAlbums(e.target.dataset.artistName);
    });
  }
}

function clickChip(e) {
  if (
    e.target.className.includes("chip") &&
    e.target.id !== "chips" &&
    !e.target.className.includes("sort")
  ) {
    document
      .querySelectorAll("#sort .selected")
      .forEach(chip => chip.classList.remove("selected"));
    e.target.classList.toggle("selected");
    let clicked = [...document.querySelectorAll(".selected")].map(chip => {
      return parseInt(chip.dataset.id);
    });

    if (clicked.length == 0) {
      reRender();
    } else {
      // debugger;
      Genre.filterAlbums(clicked);
    }
  }
}

function navigate(e, index) {
  let currentIndex = index;
  let nextIndex = ++currentIndex;
  let previousIndex = --currentIndex;
  if (e.key === "ArrowRight" || e.target.className.includes("chevron-right")) {
    currentIndex++;
    if (checkIndex(currentIndex)) {
      VisualArtist.domDetail(Album.page[currentIndex].id);
    }
  } else if (
    e.key === "ArrowLeft" ||
    e.target.className.includes("chevron-left")
  ) {
    currentIndex--;
    if (checkIndex(currentIndex)) {
      VisualArtist.domDetail(Album.page[currentIndex].id);
    }
  } else if (e.target.className.includes("close")) {
    document.querySelector(".modal").style.display = "none";
    document.querySelector(".modal-overlay").style.display = "none";
  }
}

function checkIndex(index) {
  if (index > -1 && index < 20) {
    return true;
  }
}

var timeOut;

function scrollToTop() {
  if (
    document.body.scrollTop !== 0 ||
    document.documentElement.scrollTop !== 0
  ) {
    window.scrollBy(0, -(window.innerHeight / 3));
    timeOut = setTimeout(scrollToTop(), 6);
  } else clearTimeout(timeOut);
}

function reRender(arg) {
  if (arguments.length && typeof arguments[0] === "object") {
    let allAlbums = arg
      .map(album => {
        return album.render();
      })
      .join("");
    document.querySelector("article").innerHTML = allAlbums;
    if (arg.length > 100) {
      addPager();
    } else {
      document.querySelector(".pager").style.display = "none";
    }

    checkCount();

    M.Tooltip.init(document.querySelectorAll(".tooltipped"), {});
  } else if (!isNaN(parseInt(arg)) || !arg) {
    document.querySelector(".progress-spinner").style.display = "block";
    fetch(`http://localhost:3003/api/v1/albums/?page=${arg}`)
      .then(resp => resp.json())
      .then(json => {
        let theseAlbums = json.map(album => {
          return Album.makeAlbum(album);
        });
        updateDom(theseAlbums);
        addPager(arg);
      });
  } else if (typeof arg === "string") {
    document.querySelector(".progress-spinner").style.display = "block";
    // debugger;
    fetch(`http://localhost:3003/api/v1/albums/?sort=${arg}`)
      .then(resp => resp.json())
      .then(json => {
        let theseAlbums = json.map(album => {
          return Album.makeAlbum(album);
        });
        updateDom(theseAlbums);
      });
  }
  scrollToTop();
}

function updateDom(theseAlbums) {
  Album.page = theseAlbums;

  let allAlbums = Album.page
    .map(album => {
      return album.render();
    })
    .join("");

  document.querySelector("article").innerHTML = allAlbums;

  document.querySelector(".pager").style.display = "block";
  document.querySelector(".progress-spinner").style.display = "none";
  M.Tooltip.init(document.querySelectorAll(".tooltipped"), {});
}

function checkCount() {
  let count = document.querySelectorAll("summary").length;
  if (count === 0) {
    setTimeout(function() {
      document.querySelector("article").innerHTML = "no results";
    }, 1000);
    document.querySelector(".pager").style.display = "none";
  }
}

function addPager(arg = 1) {
  fetch("http://localhost:3003/api/v1/albums/count")
    .then(resp => resp.json())
    .then(json => {
      let pages = Math.ceil(json.count / 20 - 1);
      let lis = "";
      for (i = 1; i <= pages; i++) {
        if (arg === i) {
          lis += `<li class="waves-effect active"><a>${i}</a></li>`;
        } else {
          lis += `<li class="waves-effect"><a>${i}</a></li>`;
        }
      }

      let pager = `<ul class="pagination">
        ${lis}
      </ul>`;

      document.querySelector(".pager").innerHTML = pager;

      document
        .querySelector(".pagination")
        .addEventListener("click", function(e) {
          if (e.target.tagName === "A") {
            reRender(parseInt(e.target.textContent));
          }
        });
    });
}

function searchIt(e) {
  e.preventDefault();
  let query = document.getElementById("search").value.toLowerCase();
  clearSelected();
  Album.searchAlbums(query);
}

function filterIt(e) {
  e.preventDefault();
  let query = document.getElementById("autocomplete-input").value.toLowerCase();
  clearSelected();
  VisualArtist.filterAlbums(query);
}

function clearSelected() {
  document.getElementById("searchForm").reset();
  document.getElementById("filterForm").reset();

  document
    .querySelectorAll(".selected")
    .forEach(chip => chip.classList.remove("selected"));
}
