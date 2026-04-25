{{/*
Expand the name of the chart.
*/}}
{{- define "zaringold.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "zaringold.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "zaringold.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "zaringold.labels" -}}
helm.sh/chart: {{ include "zaringold.chart" . }}
{{ include "zaringold.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.extraLabels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Selector labels (Next.js app)
*/}}
{{- define "zaringold.selectorLabels" -}}
app.kubernetes.io/name: {{ include "zaringold.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: nextjs
app.kubernetes.io/part-of: zaringold
{{- end }}

{{/*
Chat service selector labels
*/}}
{{- define "zaringold.chatSelectorLabels" -}}
app.kubernetes.io/name: {{ include "zaringold.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: chat-service
app.kubernetes.io/part-of: zaringold
{{- end }}

{{/*
Price service selector labels
*/}}
{{- define "zaringold.priceSelectorLabels" -}}
app.kubernetes.io/name: {{ include "zaringold.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: price-service
app.kubernetes.io/part-of: zaringold
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "zaringold.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "zaringold.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Return the proper image reference
*/}}
{{- define "zaringold.image" -}}
{{- $registry := .Values.global.imageRegistry | default .Values.image.registry | default "" -}}
{{- if $registry -}}
{{- printf "%s/%s:%s" $registry .Values.image.repository ( .Values.image.tag | default .Chart.AppVersion ) -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.repository ( .Values.image.tag | default .Chart.AppVersion ) -}}
{{- end -}}
{{- end }}

{{/*
Return the proper chat image reference
*/}}
{{- define "zaringold.chatImage" -}}
{{- $registry := .Values.global.imageRegistry | default "" -}}
{{- if $registry -}}
{{- printf "%s/%s:%s" $registry .Values.chatImage.repository .Values.chatImage.tag -}}
{{- else -}}
{{- printf "%s:%s" .Values.chatImage.repository .Values.chatImage.tag -}}
{{- end -}}
{{- end }}

{{/*
Return the proper price image reference
*/}}
{{- define "zaringold.priceImage" -}}
{{- $registry := .Values.global.imageRegistry | default "" -}}
{{- if $registry -}}
{{- printf "%s/%s:%s" $registry .Values.priceImage.repository .Values.priceImage.tag -}}
{{- else -}}
{{- printf "%s:%s" .Values.priceImage.repository .Values.priceImage.tag -}}
{{- end -}}
{{- end }}

{{/*
Generate secret environment variables
*/}}
{{- define "zaringold.secretEnvs" -}}
{{- if .Values.secrets.enabled }}
{{- if .Values.secrets.existingSecret }}
- secretRef:
    name: {{ .Values.secrets.existingSecret }}
{{- else }}
- secretRef:
    name: {{ include "zaringold.fullname" . }}-secrets
{{- end }}
{{- end }}
{{- end }}
