import { db } from './config';
import {
  collection, doc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, orderBy,
  onSnapshot, serverTimestamp
} from 'firebase/firestore';

// ─── COLEÇÕES ───────────────────────────────────────────────────────────────
// users/{uid}         → perfil do corretor/admin
// eventos/{eventoId}  → cada sexta-feira é um evento
// vendas/{vendaId}    → cada venda registrada
// duelos/{dueloId}    → cada duelo
// mensagens/{msgId}   → provocações durante duelos
// notificacoes/{uid}/itens/{id} → notificações por usuário

// ─── ESTRUTURA DOS DOCUMENTOS ───────────────────────────────────────────────
/*
users/{uid}: {
  uid, nome, email, role: 'admin'|'corretor',
  fotoBase64: string|null,
  ativo: boolean,
  criadoEm: timestamp,
  historico: { totalVidas, totalValor, totalDuelos, duelosVencidos }
}

eventos/{eventoId}: {
  id, nome, data, inicio, fim,
  ativo: boolean,
  criadoEm: timestamp
}

vendas/{vendaId}: {
  id, eventoId, corretorId, corretorNome,
  vidas: number,
  valor: number,
  observacao: string,
  criadoEm: timestamp,
  editadoEm: timestamp|null
}

duelos/{dueloId}: {
  id, eventoId,
  desafiante: { uid, nome, fotoBase64 },
  desafiado:  { uid, nome, fotoBase64 },
  tipo: 'vidas'|'valor',
  meta: number,
  prazo: timestamp|null,
  duracaoMinutos: number|null,
  status: 'pendente'|'ativo'|'encerrado'|'recusado',
  vencedor: uid|null,
  criadoPor: 'corretor'|'admin',
  criadoEm: timestamp,
  iniciadoEm: timestamp|null,
  encerradoEm: timestamp|null
}

mensagens/{msgId}: {
  id, dueloId, autorId, autorNome,
  texto: string,
  criadoEm: timestamp
}

notificacoes/{uid}/itens/{id}: {
  id, tipo: 'duelo_proposto'|'duelo_aprovado'|'duelo_recusado'|'duelo_encerrado',
  titulo, corpo,
  lida: boolean,
  dueloId: string|null,
  criadoEm: timestamp
}
*/

// ─── USUÁRIOS ────────────────────────────────────────────────────────────────
export const criarUsuario = async (uid, dados) => {
  await setDoc(doc(db, 'users', uid), {
    uid,
    ...dados,
    fotoBase64: null,
    ativo: true,
    criadoEm: serverTimestamp(),
    historico: { totalVidas: 0, totalValor: 0, totalDuelos: 0, duelosVencidos: 0 }
  });
};

export const buscarUsuario = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const listarCorretores = async () => {
  const q = query(collection(db, 'users'), where('role', '==', 'corretor'), where('ativo', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
};

export const atualizarUsuario = async (uid, dados) => {
  await updateDoc(doc(db, 'users', uid), dados);
};

export const excluirUsuario = async (uid) => {
  await updateDoc(doc(db, 'users', uid), { ativo: false });
};

// ─── EVENTOS ─────────────────────────────────────────────────────────────────
export const criarEvento = async (dados) => {
  const ref = doc(collection(db, 'eventos'));
  await setDoc(ref, { id: ref.id, ...dados, ativo: true, criadoEm: serverTimestamp() });
  return ref.id;
};

export const buscarEventoAtivo = async () => {
  const q = query(collection(db, 'eventos'), where('ativo', '==', true));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data();
};

export const encerrarEvento = async (eventoId) => {
  await updateDoc(doc(db, 'eventos', eventoId), { ativo: false });
};

// ─── VENDAS ───────────────────────────────────────────────────────────────────
export const registrarVenda = async (dados) => {
  const ref = doc(collection(db, 'vendas'));
  await setDoc(ref, { id: ref.id, ...dados, criadoEm: serverTimestamp(), editadoEm: null });
  return ref.id;
};

export const editarVenda = async (vendaId, dados) => {
  await updateDoc(doc(db, 'vendas', vendaId), { ...dados, editadoEm: serverTimestamp() });
};

export const excluirVenda = async (vendaId) => {
  await deleteDoc(doc(db, 'vendas', vendaId));
};

export const ouvirVendasEvento = (eventoId, callback) => {
  const q = query(collection(db, 'vendas'), where('eventoId', '==', eventoId), orderBy('criadoEm', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => d.data())));
};

// ─── DUELOS ───────────────────────────────────────────────────────────────────
export const criarDuelo = async (dados) => {
  const ref = doc(collection(db, 'duelos'));
  await setDoc(ref, { id: ref.id, ...dados, status: 'pendente', vencedor: null, criadoEm: serverTimestamp(), iniciadoEm: null, encerradoEm: null });
  return ref.id;
};

export const aprovarDuelo = async (dueloId) => {
  await updateDoc(doc(db, 'duelos', dueloId), { status: 'ativo', iniciadoEm: serverTimestamp() });
};

export const recusarDuelo = async (dueloId) => {
  await updateDoc(doc(db, 'duelos', dueloId), { status: 'recusado' });
};

export const encerrarDuelo = async (dueloId, vencedorUid) => {
  await updateDoc(doc(db, 'duelos', dueloId), { status: 'encerrado', vencedor: vencedorUid, encerradoEm: serverTimestamp() });
};

export const ouvirDuelosAtivos = (eventoId, callback) => {
  const q = query(collection(db, 'duelos'), where('eventoId', '==', eventoId), where('status', '==', 'ativo'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => d.data())));
};

export const ouvirDuelosPendentes = (callback) => {
  const q = query(collection(db, 'duelos'), where('status', '==', 'pendente'), orderBy('criadoEm', 'asc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => d.data())));
};

// ─── MENSAGENS DE PROVOCAÇÃO ──────────────────────────────────────────────────
export const enviarMensagem = async (dados) => {
  const ref = doc(collection(db, 'mensagens'));
  await setDoc(ref, { id: ref.id, ...dados, criadoEm: serverTimestamp() });
};

export const ouvirMensagensDuelo = (dueloId, callback) => {
  const q = query(collection(db, 'mensagens'), where('dueloId', '==', dueloId), orderBy('criadoEm', 'asc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => d.data())));
};

// ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────
export const enviarNotificacao = async (uid, dados) => {
  const ref = doc(collection(db, `notificacoes/${uid}/itens`));
  await setDoc(ref, { id: ref.id, ...dados, lida: false, criadoEm: serverTimestamp() });
};

export const ouvirNotificacoes = (uid, callback) => {
  const q = query(collection(db, `notificacoes/${uid}/itens`), orderBy('criadoEm', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => d.data())));
};

export const marcarNotificacaoLida = async (uid, notifId) => {
  await updateDoc(doc(db, `notificacoes/${uid}/itens`, notifId), { lida: true });
};

// ─── RANKING (tempo real) ─────────────────────────────────────────────────────
export const ouvirRanking = (eventoId, callback) => {
  return ouvirVendasEvento(eventoId, (vendas) => {
    const mapa = {};
    vendas.forEach(v => {
      if (!mapa[v.corretorId]) {
        mapa[v.corretorId] = { corretorId: v.corretorId, corretorNome: v.corretorNome, totalVidas: 0, totalValor: 0 };
      }
      mapa[v.corretorId].totalVidas += v.vidas || 0;
      mapa[v.corretorId].totalValor += v.valor || 0;
    });
    const lista = Object.values(mapa);
    const porVidas = [...lista].sort((a, b) => b.totalVidas - a.totalVidas);
    const porValor = [...lista].sort((a, b) => b.totalValor - a.totalValor);
    callback({ porVidas, porValor });
  });
};
