this.workflowCockpit = workflowCockpit({
    init: _init,
    onSubmit: _saveData,
    onError: _rollback,
});

let view = {}
console.log('batata')

function _init(data, info) {
    console.log("Informações do processo:", data)
    view = data.loadContext.fieldsPermission
    console.log('VIEW')


    info.getUserData().then(
        (user) => {
            console.log('User:', user)
        }
    ).then(() => {
        info.getPlatformData().then(
            (platformData) => { console.log('Dados da plataforma:', platformData) }
        )
    })



    info.getInfoFromProcessVariables().then((processVar) => {
        if (!info.isRequestNew() && Array.isArray(processVar)) {

            let map = new Map()
            processVar.map(({ key, value }) => map.set(key, value))
            console.log('Loading...', map)

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
                setTimeout(() => {
                    let selectNomFor = searchOrRegister().querySelector('.nom-For')
                    let selectChildrens = Array.from(selectNomFor.children)
                    selectChildrens.map((el) => {
                        if (el.value == map.get('nomFor')) {
                            el.setAttribute('selected', 'selected')
                            handleSelectSupplier(selectNomFor)
                        }
                    })
                }, 2000)
            }

            let i = 1
            while (map.get(`tabSol-${i}`) !== undefined) {
                document.querySelector('#requester').value = map.get(`tabSol-${i}`)
                document.querySelector('#qntd').value = map.get(`tabQnt-${i}`)
                document.querySelector('#name').value = map.get(`tabDes-${i}`)
                document.querySelector('#unit-value').value = map.get(`tabUnV-${i}`)
                addData()
                i++
            }

            formReadOnly()
        }
    })

    function formReadOnly() {
        info.getTaskData().then((data) => {
            let { taskName } = data
            boardDecision()

            if (taskName == 'Solicitante') { throw console.log('🟡 Enable editing 📝') }

            handleChecked()
            let searchInputRadio = document.querySelector('#search-supplier-radio')
            let registerInputRadio = document.querySelector('#register-supplier-radio')

            searchInputRadio.checked ? registerInputRadio.setAttribute('disabled', 'disabled') : searchInputRadio.setAttribute('disabled', 'disabled')

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

        })
    }

    function boardDecision() {
        info.getTaskData().then((data) => {
            let { taskName } = data

            if (taskName == 'Diretoria') {
                document.querySelector('#director-area').removeAttribute('hidden')
                exportedTaskName = taskName
            }
        })
    }
}

function _saveData(data, info) {

    console.log('Informações', info)
    console.log('Formulario Válido?', isFormValid())

    if (!isFormValid()) {
        shootAlert()
        new bootstrap.Toast(document.getElementById('errorToast')).show()
        document.querySelector('.needs-validation').classList.add("was-validated")
        throw console.error('Formulário Inválido!')
    }
    tableRowsValidation()

    let newData = {}

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
    let tableRows = document.querySelector('#tbody').children
    for (let i = 0; i < tableRows.length; i++) {
        let id = i + 1
        newData[`tabSol-${id}`] = document.querySelector(`#input-requester-${id}`).value
        newData[`tabQnt-${id}`] = document.querySelector(`#input-qnt-${id}`).value
        newData[`tabDes-${id}`] = document.querySelector(`#input-name-${id}`).value
        newData[`tabUnV-${id}`] = document.querySelector(`#input-unitValue-${id}`).value
        newData[`tabToV-${id}`] = document.querySelector(`#input-totalValue-${id}`).value
    }
    newData.tabTot = document.querySelector('#display-value').value

    if (exportedTaskName == "Diretoria") {
        newData.directorDecision = document.querySelector('#floatingSelect').value
        newData.directorDecisionObs = document.querySelector('#floatingTextarea2').value
    }

    console.log(newData)
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

    let tableRows = document.querySelector('#tbody').children
    for (let i = 0; i < tableRows.length; i++) {
        let id = i + 1
        dataValid.push(document.querySelector(`#input-requester-${id}`).value)
        dataValid.push(document.querySelector(`#input-qnt-${id}`).value)
        dataValid.push(document.querySelector(`#input-name-${id}`).value)
        dataValid.push(document.querySelector(`#input-unitValue-${id}`).value)
        dataValid.push(document.querySelector(`#input-totalValue-${id}`).value)
    }

    let dataInvalid = dataValid.filter((value) => { return value == '' })
    let isChecked = document.querySelector('#check-value').checked

    console.log('Dados', dataValid)
    console.log('Dados Inv', dataInvalid)

    if (!isChecked) {
        document.querySelector('#check-value').setAttribute('class', 'form-check-input is-invalid')
        return false
    }
    if (dataInvalid.length > 0) {
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

