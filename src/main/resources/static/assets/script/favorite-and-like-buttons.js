const favoriteButton = document.getElementById('favorite-button');
const likeButton = document.getElementById('like-button');
const heartIcon = document.getElementById('heart-icon');
const favoriteIcon = document.getElementById('favorite-icon');

/****
 * Fonction qui sert a met un video en favoris
 * en cliquant le coeur remplie sinon il reste vide
 ****/
let favorite = false;
favoriteButton.addEventListener('click', () => {
    favorite = !favorite;

    if (favorite) {
        heartIcon.classList.remove("fi", "fi-rr-heart");
        heartIcon.classList.add("fi", "fi-sr-heart");
        heartIcon.style.color = ' #EB7A57';
    } else {
        heartIcon.classList.remove("fi", "fi-sr-heart");
        heartIcon.classList.add("fi", "fi-rr-heart");
        heartIcon.style.color = ' #FFFAE0';

    }
});

/****
 * Fonction qui sert a liker un video
 * en cliquant la pouce remplie sinon il reste vide
 ****/
let liked = false;
likeButton.addEventListener('click', () => {
    liked = !liked;

    if (liked) {
        favoriteIcon.classList.remove("fi", "fi-tr-feedback-review");
        favoriteIcon.classList.add("fi", "fi-sr-feedback-review");
        favoriteIcon.style.color = ' #EB7A57';
    } else {
        favoriteIcon.classList.remove("fi", "fi-sr-feedback-review");
        favoriteIcon.classList.add("fi", "fi-tr-feedback-review");
        favoriteIcon.style.color = ' #FFFAE0';

    }
});