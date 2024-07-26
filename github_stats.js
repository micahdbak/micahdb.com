// github_stats.js

async function get_languages_for_repo(e_id, path) {
  try {
    // fetch languages for this GitHub repository
    const req = await fetch(`https://api.github.com/repos/${path}/languages`);

    if (!req.ok) {
      throw new Error(`Request to https://api.github.com/repos/${path}/languages unsuccessful.`);
    }

    const languages = await req.json();
    if (languages.length === 0) {
      return;
    }

    const element = document.getElementById(e_id);
    element.innerHTML += `&middot;&nbsp;<i>${Object.keys(languages).join(', ')}</i>`;
  } catch (err) {
    console.log(err);
  }
}
