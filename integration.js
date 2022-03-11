this.workflowCockpit = workflowCockpit({
    init: _init,
    onSubmit: _saveData,
    onError: _rollback,
});

let _info = {}

async function _init(data, info) {
    showLoadingModal()
    await createOptions()

    _info = info
    let username = ''
    let token = ''
    let requestId = data.processInstanceId

    await info.getUserData().then((user) => {
        username = user.username
    })

    await info.getPlatformData().then((data) => {
        token = data.token.access_token
    })


    info.getInfoFromProcessVariables().then((processVar) => {
        if (!info.isRequestNew() && Array.isArray(processVar)) {

            let map = new Map()
            processVar.map(({ key, value }) => map.set(key, value))

            // Preenchendo os campos do formulario

            let busFor = map.get('busFor')
            if (busFor == 'false') {
                document.querySelector('#register-supplier-radio').setAttribute('checked', 'checked')

                document.querySelector('#setor-select').value = map.get('selSet')
                searchOrRegister().querySelector('.nom-For').value = map.get('nomFor')
                searchOrRegister().querySelector('.cep-For').value = map.get('cepFor')
                searchOrRegister().querySelector('.cid-For').value = map.get('cidFor')
                searchOrRegister().querySelector('.uf-For').value = map.get('ufFor')
                searchOrRegister().querySelector('.end-For').value = map.get('endFor')
                searchOrRegister().querySelector('.bai-For').value = map.get('baiFor')
                searchOrRegister().querySelector('.email-For').value = map.get('emailFor')
                searchOrRegister().querySelector('.tel-For').value = map.get('telFor')
            } else {
                document.querySelector('#setor-select').value = map.get('selSet')
                Array.from(document.querySelectorAll('.spinner-border')).map((el) => el.removeAttribute('hidden'))
                let selectNomFor = searchOrRegister().querySelector('.nom-For')
                let selectChildrens = Array.from(selectNomFor.children)
                selectChildrens.map((el) => {
                    if (el.value == map.get('nomFor')) {
                        el.setAttribute('selected', 'selected')
                        handleSelectSupplier(selectNomFor)
                    }
                })
                document.querySelector('.select2-selection__rendered').innerHTML = map.get('nomFor')
            }

            // let i = 1
            // while (map.get(`tabSol-${i}`) !== undefined) {
            //     document.querySelector('#requester').value = map.get(`tabSol-${i}`)
            //     document.querySelector('#qntd').value = map.get(`tabQnt-${i}`)
            //     document.querySelector('#name').value = map.get(`tabDes-${i}`)
            //     document.querySelector('#unit-value').value = map.get(`tabUnV-${i}`)
            //     addData()
            //     i++
            // }
            let tableSplited = map.get('tableStr').split('/')
            // console.log(tableSplited.length - 1)
            for (let i = 0; i < tableSplited.length - 1; i++) {
                const rowSplited = tableSplited[i].split('|')
                document.querySelector('#requester').value = rowSplited[0]
                document.querySelector('#qntd').value = rowSplited[1]
                document.querySelector('#name').value = rowSplited[2]
                document.querySelector('#unit-value').value = rowSplited[3]
                addData()
            }

            // Verifica se a solicitação ja passou pela diretoria
            let decision = map.get('directorDecision')

            if (decision) {
                let decisionObs = map.get('directorDecisionObs')

                document.querySelector('#floatingSelect').value = decision
                document.querySelector('#floatingSelect').setAttribute('disabled', 'disabled')
                document.querySelector('#director-area').removeAttribute('hidden')
                if (decisionObs) {
                    document.querySelector('#floatingTextarea2').value = decisionObs
                    document.querySelector('#floatingTextarea2').setAttribute('readonly', 'readonly')
                } else {
                    document.querySelector('#ctrlFloatingTextarea').setAttribute('hidden', 'hidden')
                }
            }

            formReadOnly()
        }
    })


    async function formReadOnly() {

        const taskInProgress = await taskStatusInProgress(username, token, requestId).then(data => {
            return data
        })

        if (!taskInProgress) {
            document.querySelector('#floatingSelect').setAttribute('disabled', 'disabled')
            document.querySelector('#floatingTextarea2').setAttribute('readonly', 'readonly')
            document.querySelector('#director-area').removeAttribute('hidden')
            setReadOnly()
        } else if (taskInProgress) {
            const taskName = await info.getTaskData().then((data) => {
                return data.taskName
            })

            boardDecision(taskName)

            if (taskName == 'Solicitante') { throw console }
            setReadOnly()
        }

        function setReadOnly() {
            console.log('Readonly')
            handleChecked()
            document.querySelector('#search-supplier-radio').setAttribute('disabled', 'disabled')
            document.querySelector('#register-supplier-radio').setAttribute('disabled', 'disabled')

            document.querySelector('#setor-select').setAttribute('disabled', 'disabled')
            searchOrRegister().querySelector('.nom-For').setAttribute('disabled', 'disabled')
            searchOrRegister().querySelector('.cep-For').setAttribute('readonly', 'readonly')
            searchOrRegister().querySelector('.cid-For').setAttribute('readonly', 'readonly')
            searchOrRegister().querySelector('.uf-For').setAttribute('readonly', 'readonly')
            searchOrRegister().querySelector('.end-For').setAttribute('readonly', 'readonly')
            searchOrRegister().querySelector('.bai-For').setAttribute('readonly', 'readonly')
            searchOrRegister().querySelector('.email-For').setAttribute('readonly', 'readonly')
            searchOrRegister().querySelector('.tel-For').setAttribute('readonly', 'readonly')
            Array.from(document.querySelectorAll('#insert input')).map((el) => { el.setAttribute('disabled', 'disabled') })
            Array.from(document.querySelectorAll('.btn')).map((el) => { el.setAttribute('disabled', 'disabled') })
            Array.from(document.querySelectorAll('table i')).map((el) => { el.remove() })
            Array.from(document.querySelectorAll('#insert i')).map((el) => { el.remove() })
        }
    }

    function boardDecision(taskName) {

        if (taskName == 'Diretoria') {
            document.querySelector('#floatingSelect').removeAttribute('disabled')
            document.querySelector('#floatingTextarea2').removeAttribute('readonly')
            document.querySelector('#ctrlFloatingTextarea').removeAttribute('hidden')
            document.querySelector('#director-area').removeAttribute('hidden')
            exportedTaskName = taskName
        }
    }

    hideLoadingModal()

}

function _saveData() {


    if (!isFormValid()) {
        shootAlert()
        new bootstrap.Toast(document.getElementById('errorToast')).show()
        document.querySelector('.needs-validation').classList.add("was-validated")
        throw console.error('Formulário Inválido!')
    }
    tableRowsValidation()

    let newData = {}

    if (_info.isRequestNew()) {
        newData.datSol = new Date().toLocaleString().substr(0, 10)
    }

    newData.busFor = inputRadioSearch()
    newData.selSet = document.querySelector('#setor-select').value
    newData.nomFor = searchOrRegister().querySelector('.nom-For').value
    newData.cepFor = searchOrRegister().querySelector('.cep-For').value
    newData.cidFor = searchOrRegister().querySelector('.cid-For').value
    newData.ufFor = searchOrRegister().querySelector('.uf-For').value
    newData.endFor = searchOrRegister().querySelector('.end-For').value
    newData.baiFor = searchOrRegister().querySelector('.bai-For').value
    newData.emailFor = searchOrRegister().querySelector('.email-For').value
    newData.telFor = searchOrRegister().querySelector('.tel-For').value

    // capturando os valores da tabela
    let tableStr = ""

    Array.from(document.querySelectorAll('#tbody tr')).map((tr) => {
        tableStr += `${tr.querySelector('.requester').value}|${tr.querySelector('.qntd').value}|${tr.querySelector('.name').value}|${tr.querySelector('.unit-value').value}|${tr.querySelector('.total-value').value}/`
    })
    newData.tabTot = document.querySelector('#display-value').value
    newData.tableStr = tableStr

    if (exportedTaskName == "Diretoria") {
        newData.directorDecision = document.querySelector('#floatingSelect').value
        newData.directorDecisionObs = document.querySelector('#floatingTextarea2').value
    }

    // console.log('Dados salvos', newData)
    return {
        formData: newData
    }

}

function searchOrRegister() {
    let searchRadio = document.querySelector('#search-supplier-radio')
    let registerRadio = document.querySelector('#register-supplier-radio')

    if (searchRadio.checked) {

        return document.querySelector('#search-supplier')

    } else if (registerRadio.checked) {

        return document.querySelector('#register-supplier')

    }
}

function inputRadioSearch() {
    let searchRadio = document.querySelector('#search-supplier-radio')
    if (searchRadio.checked) {
        return true
    } else {
        return false
    }
}

function _rollback() {
}

function shootAlert() {

    let btn = document.querySelector('#check-btn')
    let checkbox = document.querySelector('#check-value').checked

    if (!checkbox) {
        btn.setAttribute('class', 'btn btn-danger')
        return (
            document.querySelector('#alert-display').innerHTML =
            `<br>
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="bi bi-exclamation-circle-fill"></i>
        Confirme os itens da tabela!!
        <button type="button" data-bs-dismiss="alert" class="btn-close" aria-label="Close"></button>
    </div>`)
    }
}

let exportedTaskName = ''
function isFormValid() {
    let dataValid = []

    if (exportedTaskName == "Diretoria") {
        dataValid.push(document.querySelector('#floatingSelect').value)
    }

    if (inputRadioSearch() == true) {
        dataValid.push(document.querySelector('#setor-select').value)
        dataValid.push(searchOrRegister().querySelector('.nom-For').value)
    } else {
        dataValid.push(document.querySelector('#setor-select').value)
        dataValid.push(searchOrRegister().querySelector('.nom-For').value)
        dataValid.push(searchOrRegister().querySelector('.cep-For').value)
        dataValid.push(searchOrRegister().querySelector('.cid-For').value)
        dataValid.push(searchOrRegister().querySelector('.uf-For').value)
        dataValid.push(searchOrRegister().querySelector('.end-For').value)
        dataValid.push(searchOrRegister().querySelector('.bai-For').value)
        dataValid.push(searchOrRegister().querySelector('.email-For').value)
        dataValid.push(searchOrRegister().querySelector('.tel-For').value)
    }

    Array.from(document.querySelectorAll('#tbody input')).map((el) => { dataValid.push(el.value) })


    let dataInvalid = dataValid.filter((value) => { return value == '' })
    let isChecked = document.querySelector('#check-value').checked

    if (!isChecked) {
        document.querySelector('#check-value').setAttribute('class', 'form-check-input is-invalid')
        return false
    }
    if (dataInvalid.length) {
        return false
    }

    return true
}

function tableRowsValidation() {
    let rows = document.querySelector('#tbody').children.length
    if (rows == 0) {
        shootModal('modal-tableLengthValidation')
        throw console.error('Não é possivel enviar uma tabela vazia!')
    }
}

