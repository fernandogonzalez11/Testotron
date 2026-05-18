const { createGroup, getGroup, listGroups, groupDetail, addMember, removeMember, listMembers, updateGroup, deleteGroup, addMemberByEmail } = require('../models/group');
const { handleError } = require('./utils');

class GroupController {
  static create(req, res) {
    try {
      const g = createGroup({
        name: req.body.name,
        owner_id: req.user.id,
        description: req.body.description || ''
      });
    const wantsJSON = req.headers.accept && req.headers.accept.includes('application/json');

    if (wantsJSON) { return res.status(201).json({ group: g}); }

    return res.redirect('/groups');

    } catch (err) {
      return handleError(err, res);
    }
  }

  static list(req, res) {
    try {
      const owner = req.query.owner_id ? Number(req.query.owner_id) : undefined;
      const rows = listGroups({ owner_id: owner });
      res.json({ groups: rows });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static get(req, res) {
    try {
      const code = req.params.code;
      const g = getGroup(code);
      if (!g) return res.status(404).json({ error: 'Not found' });
      res.json({ group: g });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static detail(req, res) {
    try {
      const code = req.params.code;
      const g = groupDetail(code);
      if (!g) return res.status(404).json({ error: 'Not found' });
      res.json({ group: g });
    } catch (err) {
      return handleError(err, res);
    }
  }

static addMember(req, res) {

  try {
    const code = req.params.code;
    const userId = Number(req.body.user_id || req.body.id);
    const changes = addMember(code, userId);
    if (req.headers.accept?.includes('text/html')) {
      if (!changes) { return res.redirect('/groups?error=' +
          encodeURIComponent('Ya perteneces a este grupo'));}
      return res.redirect(
        '/groups?success=' +
        encodeURIComponent(
          'Te uniste al grupo correctamente'));}
    return res.json({ added: !!changes });
  } catch (err) {
    return handleError(err, res);
  }
}

static addMemberByEmail(req, res) {

  try {

    // =========================
    // DATA
    // =========================

    const code = String(
      req.params.code || ''
    )
    .trim()
    .toUpperCase();

    const email = String(
      req.body.email || ''
    )
    .trim()
    .toLowerCase();

    // =========================
    // VALIDATION
    // =========================

    if (!code) {

      return res.redirect(
        '/groups?error=' +
        encodeURIComponent(
          'Código de grupo inválido'
        )
      );
    }

    if (!email) {

      return res.redirect(
        `/groups/${code}?error=` +
        encodeURIComponent(
          'Correo inválido'
        )
      );
    }

    // =========================
    // GROUP EXISTS
    // =========================

    const group = getGroup(code);

    if (!group) {

      return res.redirect(
        '/groups?error=' +
        encodeURIComponent(
          'Grupo no encontrado'
        )
      );
    }

    // =========================
    // ADD MEMBER
    // =========================

    const user = addMemberByEmail(
      code,
      email
    );

    // =========================
    // SUCCESS
    // =========================

    return res.redirect(
      `/groups/${code}?success=` +
      encodeURIComponent(
        `${user.name} fue agregado correctamente`
      )
    );

  } catch (err) {

    return res.redirect(
      `/groups/${req.params.code}?error=` +
      encodeURIComponent(
        err.message || 'No se pudo agregar el usuario'
      )
    );
  }
}

static joinGroupByCode(req, res) {

  try {
    if (!req.user) {

      return res.redirect('/auth/login');
    }

    if (req.user.role !== 'student') {

      return res.redirect(
        '/groups?error=' +
        encodeURIComponent(
          'Solo estudiantes pueden ingresar a grupos'
        )
      );
    }

    const code = String(
      req.body.code || ''
    )
    .trim()
    .toUpperCase();

    if (!code) {

      return res.redirect(
        '/groups?error=' +
        encodeURIComponent(
          'Código inválido'
        )
      );
    }
    const group = getGroup(code);

    if (!group) {

      return res.redirect(
        '/groups?error=' +
        encodeURIComponent(
          'Grupo no encontrado'
        )
      );
    }
    req.params.code = code;
    req.body.user_id = req.user.id;

    return GroupController.addMember(req, res);

  } catch (err) {

    return handleError(err, res);
  }
}

  static members(req, res) {
    try {
      const code = req.params.code;
      const members = listMembers(code);
      res.json({ members });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static removeMember(req, res) {
    try {
      const code = req.params.code;
      const userId = Number(req.body.user_id || req.body.id);
      const changes = removeMember(code, userId);
      res.json({ removed: !!changes });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static update(req, res) {
    try {
      const code = req.params.code;
      const changes = updateGroup(code, { name: req.body.name });
      res.json({ updated: changes });
    } catch (err) {
      return handleError(err, res);
    }
  }

  static delete(req, res) {
    try {
      const code = req.params.code;
      const changes = deleteGroup(code);
     
      if (!changes) { return handleError( new Error('Grupo no encontrado'), res ); }
      
      return res.json({ success: true });

    } catch (err) {
      return handleError(err, res);
    }
  }
}

module.exports = { GroupController };
