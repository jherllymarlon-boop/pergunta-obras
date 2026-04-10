const PDFDocument = require('pdfkit');
const { Resend } = require('resend');

// ── CORES ──────────────────────────────────────────────────────────────
const COR_AZUL        = '#1a3a5c';
const COR_AZUL_MED    = '#2b6cb0';
const COR_AZUL_CLARO  = '#ebf4ff';
const COR_LARANJA     = '#c2621a';
const COR_VERDE       = '#1a7a4a';
const COR_CINZA_CLARO = '#f0ede8';
const COR_CINZA_LINHA = '#d8d0c4';
const COR_CINZA_MED   = '#5c5448';
const COR_CINZA_ESC   = '#1e1a16';

const MARGIN = 45;
const PW     = 595.28; // A4 width pt
const PH     = 841.89; // A4 height pt
const CW     = PW - 2 * MARGIN;

// ── HELPER: gerar PDF em buffer ────────────────────────────────────────
function gerarPDF(d) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── utilitários ────────────────────────────────────────────────────
    const y = () => doc.y;

    function header() {
      // Faixa azul topo
      doc.rect(0, 0, PW, 62).fill(COR_AZUL);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15)
         .text('BRIEFING DE INÍCIO DE OBRA', 0, 18, { align: 'center', width: PW });
      doc.fillColor('#93c5fd').font('Helvetica').fontSize(8.5)
         .text('Jherlly M. Domingues Engenharia  ·  Dourados–MS  ·  (67) 99234-9200', 0, 38, { align: 'center', width: PW });
      doc.fillColor('#bfdbfe').font('Helvetica').fontSize(7.5)
         .text(`Briefing enviado em: ${new Date().toLocaleString('pt-BR')}`, 0, 50, { align: 'center', width: PW });
      doc.y = 78;
    }

    function footer() {
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.moveTo(MARGIN, PH - 28).lineTo(PW - MARGIN, PH - 28)
           .strokeColor(COR_CINZA_LINHA).lineWidth(0.5).stroke();
        doc.fillColor(COR_CINZA_MED).font('Helvetica').fontSize(7)
           .text('Documento confidencial — JD Engenharia', MARGIN, PH - 22, { width: CW / 2 })
           .text(`Página ${i + 1} de ${range.count}`, MARGIN, PH - 22, { align: 'right', width: CW });
      }
    }

    function sectionHeader(num, title, sub = '') {
      doc.rect(MARGIN, y(), CW, sub ? 30 : 24).fill(COR_AZUL);
      // número
      doc.rect(MARGIN, y(), 28, sub ? 30 : 24).fill(COR_AZUL_MED);
      const yy = y();
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12)
         .text(num, MARGIN, yy + (sub ? 9 : 7), { width: 28, align: 'center' });
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10.5)
         .text(title, MARGIN + 32, yy + 6, { width: CW - 36 });
      if (sub) {
        doc.fillColor('#93c5fd').font('Helvetica').fontSize(8)
           .text(sub, MARGIN + 32, yy + 19, { width: CW - 36 });
      }
      doc.y = yy + (sub ? 30 : 24) + 10;
    }

    function fieldLabel(text) {
      doc.fillColor(COR_AZUL_MED).font('Helvetica-Bold').fontSize(7)
         .text(text.toUpperCase(), { characterSpacing: 0.3 });
      doc.moveDown(0.15);
    }

    function fieldValue(text, opts = {}) {
      const val = text && String(text).trim() ? text : '—';
      doc.fillColor(COR_CINZA_ESC).font('Helvetica').fontSize(9)
         .text(val, opts);
      doc.moveDown(0.2);
    }

    function fieldBox(label, value, x, w, yy) {
      doc.rect(x, yy, w, 28).fill(COR_CINZA_CLARO).stroke().strokeColor(COR_CINZA_LINHA).lineWidth(0.5);
      doc.rect(x, yy, w, 28).stroke();
      doc.fillColor(COR_AZUL_MED).font('Helvetica-Bold').fontSize(6.5)
         .text(label.toUpperCase(), x + 3, yy + 3, { width: w - 6, characterSpacing: 0.2 });
      const val = value && String(value).trim() ? value : '';
      doc.fillColor(COR_CINZA_ESC).font('Helvetica').fontSize(8.5)
         .text(val, x + 3, yy + 14, { width: w - 6 });
    }

    function row2(l1, v1, l2, v2) {
      const yy = y();
      const half = (CW - 6) / 2;
      fieldBox(l1, v1, MARGIN,          half, yy);
      fieldBox(l2, v2, MARGIN + half + 6, half, yy);
      doc.y = yy + 34;
    }

    function row3(l1, v1, l2, v2, l3, v3) {
      const yy = y();
      const third = (CW - 10) / 3;
      fieldBox(l1, v1, MARGIN,                third, yy);
      fieldBox(l2, v2, MARGIN + third + 5,     third, yy);
      fieldBox(l3, v3, MARGIN + 2*(third + 5), third, yy);
      doc.y = yy + 34;
    }

    function bigBox(label, value, h = 50) {
      const yy = y();
      doc.rect(MARGIN, yy, CW, h).fill(COR_CINZA_CLARO);
      doc.rect(MARGIN, yy, CW, h).stroke().strokeColor(COR_CINZA_LINHA).lineWidth(0.5);
      doc.fillColor(COR_AZUL_MED).font('Helvetica-Bold').fontSize(6.5)
         .text(label.toUpperCase(), MARGIN + 3, yy + 3, { width: CW - 6, characterSpacing: 0.2 });
      if (value && String(value).trim()) {
        doc.fillColor(COR_CINZA_ESC).font('Helvetica').fontSize(8.5)
           .text(value, MARGIN + 3, yy + 14, { width: CW - 6 });
      }
      doc.y = yy + h + 6;
    }

    function divider() {
      doc.moveDown(0.3);
      doc.moveTo(MARGIN, y()).lineTo(PW - MARGIN, y())
         .strokeColor(COR_CINZA_LINHA).lineWidth(0.4).stroke();
      doc.moveDown(0.5);
    }

    function checkList(label, values) {
      if (!values || !values.length) return;
      fieldLabel(label);
      doc.fillColor(COR_CINZA_ESC).font('Helvetica').fontSize(9)
         .text('✓  ' + values.join('   ✓  '));
      doc.moveDown(0.4);
    }

    function subLabel(text) {
      doc.fillColor(COR_CINZA_MED).font('Helvetica-Bold').fontSize(7.5)
         .text(text, { characterSpacing: 0.2 });
      doc.moveDown(0.2);
    }

    function newPage() {
      doc.addPage();
      header();
    }

    // ── CONTEÚDO ───────────────────────────────────────────────────────

    header();

    // ─── 1. DADOS DO CLIENTE ──────────────────────────────────────────
    sectionHeader('1', 'Dados do Cliente', 'Informações de contato e identificação');
    row2('Nome completo', d.nome, 'CPF / CNPJ', d.cpf);
    row2('WhatsApp', d.whatsapp, 'E-mail', d.email);
    row2('Cidade / Bairro', d.cidade, 'Profissão / Ocupação', d.profissao);
    row2('Como nos conheceu', d.origem, 'Data', new Date().toLocaleDateString('pt-BR'));
    doc.moveDown(0.8);

    // ─── 2. TIPO E ESCOPO ─────────────────────────────────────────────
    sectionHeader('2', 'Tipo e Escopo da Obra', 'O que você quer construir?');

    // tipo + área
    const tipoStr = d.tipoObra + (d.tipoObraOutro ? ` — ${d.tipoObraOutro}` : '');
    row3('Tipo de obra', tipoStr, 'Área desejada', d.area ? `${d.area} m²` : '', 'Pavimentos', d.pav);
    row3('Quartos', d.quartos, 'Banheiros / Lavabos', d.banheiros, 'Padrão de acabamento', d.padrao);

    divider();

    // ambientes
    const amb = (keys, labels) => {
      const sel = keys.filter((k, i) => d[k]).map((k, i) => labels[keys.indexOf(k)]);
      return sel;
    };

    const ambSocial = ['amb_sala_estar','amb_sala_jantar','amb_sala_tv','amb_varanda','amb_churrasqueira','amb_piscina','amb_pergolado','amb_lavabo','amb_sacada','amb_salao_festas'];
    const ambSocialLabel = ['Sala de Estar','Sala de Jantar','Sala de TV','Varanda/Alpendre','Churrasqueira','Piscina','Pergolado','Lavabo','Sacada','Salão de Festas'];
    const ambServKeys = ['amb_cozinha','amb_cozinha_gourmet','amb_copa','amb_despensa','amb_area_servico','amb_lavanderia','amb_quarto_emp'];
    const ambServLabel = ['Cozinha','Cozinha Gourmet','Copa/Café','Despensa','Área de Serviço','Lavanderia','Qto Empregada'];
    const ambIntKeys = ['amb_suite_master','amb_closet','amb_escritorio','amb_quarto_hospede','amb_brinquedoteca','amb_academia','amb_hobby'];
    const ambIntLabel = ['Suíte Master','Closet','Escritório/HO','Qto Hóspedes','Brinquedoteca','Academia','Sala Hobby'];
    const ambExtKeys = ['amb_garagem1','amb_garagem2','amb_garagem3','amb_deposito','amb_jardim','amb_calcamento','amb_muro','amb_portao','amb_poco','amb_fossa'];
    const ambExtLabel = ['Gar. 1 carro','Gar. 2 carros','Gar. 3+ carros','Depósito','Jardim','Calçamento','Muro/Alamb.','Portão Elét.','Poço Artesiano','Fossa'];

    const selSocial = ambSocial.filter(k => d[k]).map((k,i) => ambSocialLabel[ambSocial.indexOf(k)]);
    const selServ   = ambServKeys.filter(k => d[k]).map(k => ambServLabel[ambServKeys.indexOf(k)]);
    const selInt    = ambIntKeys.filter(k => d[k]).map(k => ambIntLabel[ambIntKeys.indexOf(k)]);
    const selExt    = ambExtKeys.filter(k => d[k]).map(k => ambExtLabel[ambExtKeys.indexOf(k)]);

    subLabel('AMBIENTES DESEJADOS');
    if (selSocial.length) { fieldLabel('Área Social'); fieldValue(selSocial.join(' · ')); }
    if (selServ.length)   { fieldLabel('Cozinha / Serviço'); fieldValue(selServ.join(' · ')); }
    if (selInt.length)    { fieldLabel('Área Íntima'); fieldValue(selInt.join(' · ')); }
    if (selExt.length)    { fieldLabel('Garagem / Externo'); fieldValue(selExt.join(' · ')); }

    if (d.estilo) { fieldLabel('Estilo Arquitetônico'); fieldValue(d.estilo); }
    if (d.obsObra) bigBox('Observações sobre o projeto', d.obsObra, 45);
    doc.moveDown(0.6);

    // ─── 3. PROJETOS TÉCNICOS ─────────────────────────────────────────
    if (y() > 600) newPage();
    sectionHeader('3', 'Projetos Técnicos', 'Status de cada projeto');

    const projetos = [
      ['Projeto Arquitetônico', d.proj_arquitetonico],
      ['Projeto Hidráulico',    d.proj_hidraulico],
      ['Projeto Elétrico',      d.proj_eletrico],
      ['Projeto Estrutural',    d.proj_estrutural],
      ['Projeto Sanitário',     d.proj_sanitario],
      ['SPDA / Aterramento',    d.proj_spda],
    ];

    // tabela 2 colunas
    const colW = (CW - 4) / 2;
    let px = MARGIN, py = y();
    projetos.forEach(([nome, status], i) => {
      if (i === 3) { px = MARGIN + colW + 4; py = y() - 3 * 32; }
      const bg = i % 2 === 0 ? COR_CINZA_CLARO : '#ffffff';
      doc.rect(px, py + (i < 3 ? i : i - 3) * 32, colW, 30).fill(bg)
         .rect(px, py + (i < 3 ? i : i - 3) * 32, colW, 30).stroke().strokeColor(COR_CINZA_LINHA).lineWidth(0.5);
      const rowY = py + (i < 3 ? i : i - 3) * 32;
      doc.fillColor(COR_AZUL_MED).font('Helvetica-Bold').fontSize(7)
         .text(nome, px + 3, rowY + 3, { width: colW - 6 });
      doc.fillColor(status ? COR_VERDE : COR_CINZA_MED).font('Helvetica').fontSize(8.5)
         .text(status || '—', px + 3, rowY + 14, { width: colW - 6 });
    });
    doc.y = py + 3 * 32 + 8;

    divider();
    row2('Alvará de Construção', d.alvara, 'ART / RRT Assinada', d.art);
    doc.moveDown(0.6);

    // ─── 4. TERRENO ───────────────────────────────────────────────────
    if (y() > 580) newPage();
    sectionHeader('4', 'Situação do Terreno', 'Informações sobre o lote');

    fieldLabel('Situação');
    fieldValue(d.temTerreno);

    if (d.temTerreno === 'Sim, já tenho o terreno') {
      row3('Endereço / Localização', d.terrenoEndereco, 'Dimensões', d.terrenoDim, 'Área Total', d.terrenoArea ? `${d.terrenoArea} m²` : '');
      row3('Regularizado?', d.terrenoReg, 'Topografia', d.terrTopo, 'Água e Esgoto', d.redeTerr);
    }
    doc.moveDown(0.6);

    // ─── 5. FINANCEIRO ────────────────────────────────────────────────
    if (y() > 560) newPage();
    sectionHeader('5', 'Situação Financeira', 'Para indicarmos a melhor linha de crédito');

    // formas de pagamento (checkboxes múltiplos)
    const formas = ['fin_proprios','fin_mcmv','fin_fgts','fin_misto','fin_decidindo']
      .filter(k => d[k])
      .map(k => ({ fin_proprios:'Recursos Próprios', fin_mcmv:'MCMV', fin_fgts:'Financiamento/FGTS', fin_misto:'Misto', fin_decidindo:'Ainda Decidindo' }[k]));
    fieldLabel('Como pretende pagar a obra');
    fieldValue(formas.length ? formas.join('  +  ') : '—');

    row2('Renda Familiar Mensal', d.renda, 'FGTS Disponível', d.fgts);
    row2('Orçamento Total', d.orcamento ? `R$ ${parseInt(d.orcamento).toLocaleString('pt-BR')}` : '', 'Simulação de Crédito', d.temSimulacao);

    if (d.temSimulacao === 'Sim') {
      divider();
      subLabel('DADOS DA SIMULAÇÃO');
      row2('Banco / Instituição', d.simBanco, 'Valor Aprovado / Simulado', d.simValor);
      row2('Valor da Entrada', d.simEntrada, 'Parcela Mensal Estimada', d.simParcela);
      if (d.simObs) bigBox('Observações sobre o financiamento', d.simObs, 36);
    }
    doc.moveDown(0.6);

    // ─── 6. EXPECTATIVAS ─────────────────────────────────────────────
    if (y() > 560) newPage();
    sectionHeader('6', 'Expectativas e Referências', 'Como você imagina a sua obra?');

    // prazos (múltiplos)
    const prazosKeys = ['prazo_rapido','prazo_3meses','prazo_6meses','prazo_planejando'];
    const prazosLabel = ['O mais rápido possível','Até 3 meses','3 a 6 meses','Ainda planejando'];
    const prazos = prazosKeys.filter(k => d[k]).map((k,i) => prazosLabel[prazosKeys.indexOf(k)]);
    fieldLabel('Prazo desejado para início');
    fieldValue(prazos.length ? prazos.join('  /  ') : '—');

    if (d.estilo) { fieldLabel('Estilo Arquitetônico'); fieldValue(d.estilo); }
    if (d.referencias) bigBox('Referências / Inspirações', d.referencias, 45);
    doc.moveDown(0.6);

    // ─── 7. COMPLEMENTAR ─────────────────────────────────────────────
    if (y() > 560) newPage();
    sectionHeader('7', 'Informações Complementares', 'Perfil e preferências do cliente');

    const receiosKeys = ['receio_prazo','receio_custo','receio_qualidade','receio_burocracia','receio_confianca','receio_material'];
    const receiosLabel = ['Prazo','Custo','Qualidade','Burocracia','Confiança','Falta de Material'];
    const receios = receiosKeys.filter(k => d[k]).map(k => receiosLabel[receiosKeys.indexOf(k)]);
    if (receios.length) { fieldLabel('Maiores receios'); fieldValue(receios.join(' · ')); }

    row2('Preferência de atendimento', d.atendimento, 'Melhor horário para contato', d.horario);
    if (d.mensagem) bigBox('Mensagem adicional / Dúvidas', d.mensagem, 55);

    // ─── ASSINATURA ───────────────────────────────────────────────────
    if (y() > 700) newPage();
    doc.moveDown(1);
    doc.moveTo(MARGIN, y()).lineTo(PW - MARGIN, y()).strokeColor(COR_CINZA_LINHA).lineWidth(0.4).stroke();
    doc.moveDown(0.5);
    doc.fillColor(COR_CINZA_MED).font('Helvetica').fontSize(8)
       .text(`Data: ______ / ______ / __________      Assinatura do cliente: _____________________________________`, { align: 'center' });

    // ─── USO INTERNO ─────────────────────────────────────────────────
    doc.moveDown(1);
    const uyy = y();
    doc.rect(MARGIN, uyy, CW, 60).fill(COR_AZUL_CLARO);
    doc.rect(MARGIN, uyy, CW, 60).stroke().strokeColor(COR_CINZA_LINHA).lineWidth(0.5);
    doc.fillColor(COR_AZUL).font('Helvetica-Bold').fontSize(8)
       .text('USO INTERNO — JD ENGENHARIA', MARGIN + 5, uyy + 5);
    doc.fillColor(COR_CINZA_MED).font('Helvetica').fontSize(7.5)
       .text('Responsável pelo atendimento: _______________________________   Data de recebimento: ___/___/______', MARGIN + 5, uyy + 20)
       .text('Observações internas:', MARGIN + 5, uyy + 35)
       .text('', MARGIN + 5, uyy + 47);

    // finaliza
    footer();
    doc.end();
  });
}

// ── HANDLER PRINCIPAL ─────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const d = JSON.parse(event.body);

    // 1. Gerar PDF
    const pdfBuffer = await gerarPDF(d);
    const pdfBase64 = pdfBuffer.toString('base64');

    // 2. Enviar e-mail via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const nomeCliente = d.nome || 'Cliente';
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    await resend.emails.send({
      from:    'briefing@jherllyengenharia.com.br',
      to:      ['jherllymarlon@gmail.com'],
      subject: `📋 Novo Briefing de Obra — ${nomeCliente} (${dataHoje})`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1a3a5c;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">Novo Briefing de Obra</h1>
            <p style="color:#93c5fd;margin:6px 0 0;">Jherlly M. Domingues Engenharia</p>
          </div>
          <div style="background:#f0ede8;padding:24px;border-radius:0 0 8px 8px;">
            <p style="color:#1e1a16;font-size:15px;">Novo briefing recebido de <strong>${nomeCliente}</strong>.</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr><td style="padding:6px;color:#5c5448;font-weight:bold;">Nome</td><td style="padding:6px;">${d.nome || '—'}</td></tr>
              <tr style="background:#fff;"><td style="padding:6px;color:#5c5448;font-weight:bold;">WhatsApp</td><td style="padding:6px;">${d.whatsapp || '—'}</td></tr>
              <tr><td style="padding:6px;color:#5c5448;font-weight:bold;">E-mail</td><td style="padding:6px;">${d.email || '—'}</td></tr>
              <tr style="background:#fff;"><td style="padding:6px;color:#5c5448;font-weight:bold;">Cidade</td><td style="padding:6px;">${d.cidade || '—'}</td></tr>
              <tr><td style="padding:6px;color:#5c5448;font-weight:bold;">Tipo de Obra</td><td style="padding:6px;">${d.tipoObra || '—'}</td></tr>
              <tr style="background:#fff;"><td style="padding:6px;color:#5c5448;font-weight:bold;">Área</td><td style="padding:6px;">${d.area ? d.area + ' m²' : '—'}</td></tr>
              <tr><td style="padding:6px;color:#5c5448;font-weight:bold;">Orçamento</td><td style="padding:6px;">${d.orcamento ? 'R$ ' + parseInt(d.orcamento).toLocaleString('pt-BR') : '—'}</td></tr>
            </table>
            <p style="color:#5c5448;font-size:12px;margin-top:16px;">O briefing completo está anexado em PDF neste e-mail.</p>
          </div>
        </div>
      `,
      attachments: [{
        filename: `briefing_${nomeCliente.replace(/\s+/g,'_')}_${dataHoje.replace(/\//g,'-')}.pdf`,
        content:  pdfBase64,
      }],
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true }),
    };

  } catch (err) {
    console.error('Erro:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
