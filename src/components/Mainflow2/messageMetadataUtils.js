import { getModel3dKind, isImageUrl } from '../../utils/model3d';

/** Parse DesignLog metadataJson into attachment URLs and known object fields. */
export function parseMessageMetadata(metadataJson) {
  if (!metadataJson) {
    return { attachments: [], modelFileUrl: null, sourceImageUrl: null, raw: null };
  }

  try {
    const parsed = JSON.parse(metadataJson);
    if (Array.isArray(parsed)) {
      return { attachments: parsed.filter(Boolean), modelFileUrl: null, sourceImageUrl: null, raw: parsed };
    }
    if (parsed && typeof parsed === 'object') {
      const attachments = [];
      if (parsed.modelFileUrl) attachments.push(parsed.modelFileUrl);
      if (parsed.autoPreviewGlbUrl) attachments.push(parsed.autoPreviewGlbUrl);
      if (Array.isArray(parsed.designFileUrls)) attachments.push(...parsed.designFileUrls);
      if (Array.isArray(parsed.attachmentUrls)) attachments.push(...parsed.attachmentUrls);
      const unique = [...new Set(attachments.filter(Boolean))];
      return {
        attachments: unique,
        modelFileUrl: parsed.modelFileUrl || null,
        sourceImageUrl: parsed.sourceImageUrl || null,
        raw: parsed,
      };
    }
  } catch {
    /* ignore */
  }

  return { attachments: [], modelFileUrl: null, sourceImageUrl: null, raw: null };
}

export function getMessageAuthorId(msg) {
  return msg?.accountId ?? msg?.authorAccountId ?? null;
}

export function classifyAttachmentUrl(url) {
  if (isImageUrl(url)) return 'image';
  const kind = getModel3dKind(url);
  if (kind !== 'unknown') return kind;
  return 'file';
}
