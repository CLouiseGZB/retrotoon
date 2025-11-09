const inputUser = document.getElementById('input-user');
const containerGeneralComment = document.getElementById('comment-container')
const submitButton = document.getElementById('submit');
let userCommentRow = document.getElementById('user-comment-row');


function addComment() {

    // 1.Création d'un nouvel élément <p> pour afficher le commentaitre
    let comment = document.createElement('p');
    comment.classList.add('commentaire');

    // 2.Vérification pour empêcher d'envoyer un commentaire vide
    if (inputUser.value.trim() == "" || inputUser.value == null) {
        alert("Laissez un commentaire !");
        return false;
    } else {

        comment.innerHTML = inputUser.value;

        containerGeneralComment.appendChild(userCommentRow);
        containerGeneralComment.appendChild(comment);


        /************ BOUTON SOUS ICONE DE POUBELLE QUI SUPPRIME INDIVIDUELLEMENT LES COMMENTAIRES ************/
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