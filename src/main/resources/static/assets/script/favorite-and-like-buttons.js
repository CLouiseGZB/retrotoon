const favoriteButton = document.getElementById('favorite-button');
const likeButton = document.getElementById('like-button');
const heartIcon = document.getElementById('heart-icon');
const favoriteIcon = document.getElementById('favorite-icon');

/************ FAVORITE AND LIKE SECTION ************/
// BOUTON COEUR
let favorite = false;
favoriteButton.addEventListener('click', () => {
    favorite = !favorite;

    if (favorite) {
        //afficher l'icone "favoris" (coeur plein)
        heartIcon.classList.remove("fi", "fi-rr-heart");
        heartIcon.classList.add("fi", "fi-sr-heart");
        heartIcon.style.color = ' #EB7A57';
    } else {
        //afficher l'icone "favoris" (coeur vide)
        heartIcon.classList.remove("fi", "fi-sr-heart");
        heartIcon.classList.add("fi", "fi-rr-heart");
        heartIcon.style.color = ' #FFFAE0';

    }
});

// BOUTON POUCE LEVÉ
let liked = false; // Suivre l'état du "like"
likeButton.addEventListener('click', () => {
    liked = !liked; // Bascule entre like/unlike

    if (liked) {
        // Afficher l'icône "like" (pouce levé plein)
        favoriteIcon.classList.remove("fi", "fi-tr-feedback-review");
        favoriteIcon.classList.add("fi", "fi-sr-feedback-review");
        favoriteIcon.style.color = ' #EB7A57';
    } else {
        // Afficher l'icône "unlike" (pouce levé vide)
        favoriteIcon.classList.remove("fi", "fi-sr-feedback-review");
        favoriteIcon.classList.add("fi", "fi-tr-feedback-review");
        favoriteIcon.style.color = ' #FFFAE0';

    }
});