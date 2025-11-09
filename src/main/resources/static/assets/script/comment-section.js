/****
 * Fonction pour créer un commentaire
 * avec des vérifications pour empêcher d'envoyer un commentaire vide
 * Rechercher la série "Totally Spies" par son nom et afficher avec ses détails
****/
const inputUser = document.getElementById('input-user');
const containerGeneralComment = document.getElementById('comment-container')
const submitButton = document.getElementById('submit');
let userCommentRow = document.getElementById('user-comment-row');

function addComment() {

    let comment = document.createElement('p');
    comment.classList.add('commentaire');
    if (inputUser.value.trim() == "" || inputUser.value == null) {
        alert("Laissez un commentaire !");
        return false;
    } else {

        comment.innerHTML = inputUser.value;
        containerGeneralComment.appendChild(userCommentRow);
        containerGeneralComment.appendChild(comment);

        let aSupprimer = document.createElement('span');

        aSupprimer.innerHTML = '<i class="fa-solid fa-trash"></i>';

        aSupprimer.style = 'color: #FACA78; font-size: 20px; cursor: pointer; margin-left: 10px;';

        comment.appendChild(aSupprimer);

        aSupprimer.addEventListener("click", function (event) {
            event.stopPropagation();
            userCommentRow.remove();
            comment.remove();
        });
    }
}
submitButton.addEventListener("click", addComment);