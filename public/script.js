// client-side js, loaded by index.html
// run by the browser each time the page is loaded

// define variables that reference elements on our page
const searchbar = document.getElementById("searchbar");
const searchform = document.querySelector("#search");
const table = document.getElementById("jobstable");
$(document).ready(function(){processJobFinds("mowing");});
function CreateCardList(data) {
  let name = data.name.toUpperCase();
  let address = data.address;
  let skills = ParseToCleanString(data.skills, ",");

  let card = document.createElement("div");
  card.classList.add("cardview");

  card.addEventListener("click", event => {
    window.location = "/profile/" + name.toLowerCase();
  });

  let space = document.createElement("div");
  space.classList.add("space1");

  let n = document.createElement("h5");
  n.classList.add("bold");

  let a = document.createElement("h5");
  let s = document.createElement("h5");

  n.innerHTML = name;
  a.innerHTML = "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp" + address;
  s.innerHTML = "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp" + skills;

  card.appendChild(n);
  card.appendChild(a);
  card.appendChild(s);

  document.getElementById("cardList").appendChild(card);

  console.log(card);
}
searchform.addEventListener("submit", event => {
  processJobFinds(searchbar.value);
  // stop our form submission from refreshing the page
  event.preventDefault();
});
function processJobFinds(jobName) {
  fetch("/jobs/" + jobName)
    .then(resp => resp.text())
    .then(text => {
      var json = null;
      try {
        json = JSON.parse(text);
      } catch (err) {
        DeleteAllByName("cardview");
        alert("Can't find what you're looking.");
        return;
      }
      let d = json.names;
      if (!d) {alert("Can't find what you're looking.");return;}
      DeleteAllByName("cardview");
      d.forEach(a => {
        fetch("/users/" + a)
          .then(async resp => resp.json())
          .then(async json => {
            let j = await json;
            CreateCardList(j);
          });
      });
    });
}
function DeleteAllByName(name) {
  
  let elements = document.getElementsByClassName(name);
  console.log(elements);
  for (let i = 0; i < elements.length; i++) {
    elements[i].parentNode.innerHTML = "";
  }
}
function ParseToCleanString(value, separator) {
  const arr = value.toString().split(separator);
  var result = "";
  arr.forEach(a => {
    result += " " + toSentence(a);
  });
  return result;
}
function toSentence(string) {
  var first = string.charAt(0);
  first = first.toUpperCase();
  var val = string.slice(1);
  return first + val;
}
