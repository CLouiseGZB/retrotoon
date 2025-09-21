/************ COMMENTAIRES ************/
//envoi des commentaires
const inputUser = document.getElementById('input-user');
const containerGeneralComment = document.getElementById('comment-container')
const submitButton = document.getElementById('submit');
let userCommentRow = document.getElementById('user-comment-row');

/************ AJOUT D'UN COMMENTAIRE A LA BOITE DE COMMENTAIRES + VERIFICATION ************/

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


        /************ BOUTON QUI SUPPRIME INDIVIDUELLEMENT LES COMMENTAIRES ************/

        let aSupprimer = document.createElement('span');
        aSupprimer.classList.add('btn-a-supprimer');

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